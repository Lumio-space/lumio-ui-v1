import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { decodeJwt } from 'jose';

/** Routes that require authentication */
const PROTECTED_PREFIXES = ['/dashboard', '/students', '/teachers', '/classes',
  '/attendance', '/results', '/timetable', '/parents', '/roles',
  '/announcements', '/settings', '/my-classes', '/my-subjects'];

/** Routes only accessible when NOT authenticated */
const AUTH_ONLY_PREFIXES = ['/login', '/onboarding', '/forgot-password'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check both client cookie ('token') and backend cookie ('access_token')
  const rawToken = req.cookies.get('token')?.value ?? req.cookies.get('access_token')?.value;
  const token    = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  let isExpired = false;
  if (token) {
    try {
      const payload = decodeJwt(token);
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        isExpired = true;
      }
    } catch {
      isExpired = true;
    }
  }

  const validToken = token && !isExpired ? token : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Unauthenticated or expired user trying to access a protected page → login
  if (isProtected && !validToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete('token');
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('schoolId');
    }
    return response;
  }

  // Authenticated user trying to access login/onboarding → dashboard
  if (isAuthOnly && validToken) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl && (callbackUrl.startsWith('/accept-invite') || callbackUrl.startsWith('/invite'))) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

/**
 * Matcher: run middleware only on app routes.
 * Explicitly excludes static assets, _next internals, and the API.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

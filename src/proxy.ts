import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Routes that require authentication */
const PROTECTED_PREFIXES = ['/dashboard', '/students', '/teachers', '/classes',
  '/attendance', '/results', '/timetable', '/parents', '/roles',
  '/announcements', '/settings'];

/** Routes only accessible when NOT authenticated */
const AUTH_ONLY_PREFIXES = ['/login', '/onboarding', '/forgot-password'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Phase 2: replace with next-auth getToken()
  const rawToken = req.cookies.get('token')?.value;
  const token    = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Unauthenticated user trying to access a protected page → login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/onboarding → dashboard
  if (isAuthOnly && token) {
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

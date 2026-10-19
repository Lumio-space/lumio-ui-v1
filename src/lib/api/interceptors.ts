/**
 * Axios interceptors
 *
 * Imported as a side-effect from QueryProvider — runs once at module load.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ REQUEST interceptor                                             │
 * │                                                                 │
 * │ Reads the draft token from the onboarding store and attaches    │
 * │ x-draft-token only to registration draft requests — EXCEPT the │
 * │ school-info endpoint, which creates the draft and must not carry│
 * │ a token. For normal app endpoints, attaches the auth token as   │
 * │ the Authorization Bearer header.                               │
 * └─────────────────────────────────────────────────────────────────┘
 *
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ RESPONSE interceptor — error normalisation + draft detection    │
 * │                                                                 │
 * │ For all errors:                                                 │
 * │   Normalises Axios errors into plain Error objects, surfacing   │
 * │   the backend's message field when available.                   │
 * │                                                                 │
 * │ For draft-related errors (expired / invalid / not found)        │
 * │ on registration endpoints (excluding school-info):              │
 * │   Clears the persisted draft state and returns a clear error    │
 * │   message asking the user to restart from step 1.              │
 * │                                                                 │
 * │ No automatic draft creation on recovery — the backend no longer │
 * │ provides a standalone draft-creation endpoint. The user must    │
 * │ re-submit school info (step 1) to obtain a fresh draft token.  │
 * └─────────────────────────────────────────────────────────────────┘
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { apiClient }          from './axios';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAuthStore }       from '@/stores/auth.store';
import { getQueryClient }     from './query-client';

/* ── Type augmentation — adds _isRetry to Axios request config ── */

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** True when this request is a recovery retry. Prevents loops. */
    _isRetry?: boolean;
  }
}

/**
 * The school-info endpoint MUST NOT receive x-draft-token.
 * It is the step that creates the draft, so no token exists yet.
 * The backend would reject the request if a token were present.
 */
const SCHOOL_INFO_URL = '/registration/drafts/steps/school-info';

/**
 * Helper to get auth token from cookies.
 * Checks both 'token' (frontend) and 'access_token' (backend cookie).
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)(?:token|access_token)=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
}

/**
 * Helper to get active school context ID from cookies, auth store, or JWT payload.
 */
function getSchoolId(): string | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)schoolId=([^;]*)/);
    const sid = match ? decodeURIComponent(match[1]) : null;
    if (sid && sid !== 'undefined' && sid !== 'null') return sid;
  }

  const storeSchoolId = useAuthStore.getState().user?.schoolId;
  if (storeSchoolId && storeSchoolId !== 'undefined' && storeSchoolId !== 'null') {
    return storeSchoolId;
  }

  // Fallback: check if the JWT token payload itself contains school context
  const token = getAuthToken();
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const sid = payload.schoolId || payload.currentSchoolId || payload.school_id || payload.membership?.schoolId;
        if (sid) return String(sid);
      }
    } catch {
      // Ignored
    }
  }

  return null;
}

/**
 * Clears all auth cookies when a session expires or user logs out.
 */
function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'refresh_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'schoolId=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

/* ── Request: attach x-draft-token or Authorization header ─────── */

/**
 * Public authentication and invitation endpoints.
 * These endpoints never require, send, or validate existing session tokens,
 * and should never trigger session invalidation or login redirects.
 */
function isPublicAuthEndpoint(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url === '/auth/login' ||
    url.startsWith('/auth/login') ||
    url.startsWith('/auth/forgot-password') ||
    url.startsWith('/auth/reset-password') ||
    url.startsWith('/invites/accept') ||
    url.startsWith('/invites/register') ||
    url.startsWith('/invites/decline') ||
    url.startsWith('/invites/validate')
  );
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isRegistrationEndpoint = typeof config.url === 'string' && config.url.startsWith('/registration/');

  if (config.url === SCHOOL_INFO_URL) {
    // Draft does not exist yet — never attach a token for this route.
    return config;
  }

  // Public authentication and invitation endpoints: never require or validate an existing auth token
  if (isPublicAuthEndpoint(config.url)) {
    return config;
  }

  if (isRegistrationEndpoint) {
    const draftToken = useOnboardingStore.getState().draftToken;
    if (draftToken) {
      config.headers['x-draft-token'] = draftToken;
    }
  } else {
    // Attach Authorization header for non-registration endpoints
    const authToken = getAuthToken();
    if (authToken) {
      // Check token expiration before sending request
      try {
        const parts = authToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            invalidateAuthSession();
            return Promise.reject(new axios.Cancel('Session expired'));
          }
        }
      } catch {
        // Ignored
      }

      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }

    // Attach school context header for school-scoped endpoints
    const schoolId = getSchoolId();
    if (schoolId && !config.headers['x-school-id']) {
      config.headers['x-school-id'] = schoolId;
    }
  }

  return config;
});

/**
 * Centralized session invalidation helper.
 * Immediately clears cookies, auth state, react-query cache, and redirects to login.
 */
export function invalidateAuthSession(callbackUrl?: string): void {
  clearAuthCookie();
  useAuthStore.getState().setAuthenticated(false);
  useAuthStore.getState().clearUser();

  if (typeof window !== 'undefined') {
    try {
      getQueryClient().clear();
    } catch {
      // ignore in environments without query client initialized
    }

    const isInvitePath =
      window.location.pathname.startsWith('/accept-invite') ||
      window.location.pathname.startsWith('/invite');

    if (!window.location.pathname.startsWith('/login') && !isInvitePath) {
      const currentPath = window.location.pathname;
      const search      = window.location.search;
      const target      = callbackUrl ?? `${currentPath}${search}`;
      const destination = target && target !== '/' && !target.startsWith('/login')
        ? `/login?callbackUrl=${encodeURIComponent(target)}`
        : '/login';
      window.location.href = destination;
    }
  }
}

/* ── Response: error normalisation + draft-error detection ───── */

apiClient.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const config       = error.config;
    const status       = error.response?.status;
    const responseData = error.response?.data as { message?: string } | undefined;
    const backendMsg   = responseData?.message ?? '';

    /* ── Draft-error detection ──────────────────────────────────
     *
     * Conditions:
     *   • The request is a registration endpoint other than school-info
     *     (school-info creates the draft, so it can't have a draft error).
     *   • The error indicates the draft is gone or invalid:
     *       - HTTP 401 / 410
     *       - Backend message mentioning draft + expired/invalid/not found
     *       - (expired|invalid).*(draft|token)
     */
    const isRegistrationEndpoint =
      typeof config?.url === 'string' &&
      config.url.startsWith('/registration/') &&
      config.url !== SCHOOL_INFO_URL;

    const isDraftRelatedError =
      isRegistrationEndpoint &&
      !config?._isRetry &&
      (status === 401 ||
       status === 410 ||
       /draft.*(expired|invalid|not found)/i.test(backendMsg) ||
       /(expired|invalid).*(draft|token)/i.test(backendMsg));

    if (isDraftRelatedError) {
      /*
       * Clear the stale draft from the persisted store so the wizard
       * can detect the reset and return the user to step 1.
       *
       * No automatic recovery is possible here: the backend no longer
       * provides a standalone draft-creation endpoint. A fresh draft
       * is created only by submitting school info (step 1).
       */
      useOnboardingStore.getState().clearDraft();

      return Promise.reject(
        new Error(
          'Your registration session has expired. ' +
          'Please go back to step 1 to start a new registration.',
        ),
      );
    }

    /* ── Auth-session expiry/invalidation detection ───────────── */
    if (!isRegistrationEndpoint && !isPublicAuthEndpoint(config?.url)) {
      // 1. Token invalid / expired on protected endpoints: 401
      if (status === 401) {
        invalidateAuthSession();
      }
      // 2. User account/membership revoked or deleted: 403 with membership loss message
      else if (
        status === 403 &&
        (/no membership found/i.test(backendMsg) ||
         /school context is required/i.test(backendMsg) ||
         /user.*(not found|inactive|disabled|deleted)/i.test(backendMsg))
      ) {
        invalidateAuthSession();
      }
    }

    const message =
      backendMsg ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    const err = new Error(message) as Error & { status?: number; response?: unknown };
    if (status) err.status = status;
    if (error.response) err.response = error.response;

    return Promise.reject(err);
  },
);

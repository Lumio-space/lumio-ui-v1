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
 * Used by both draft-token and Authorization header interceptors.
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
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
 * Clears the auth cookie when a session expires.
 */
function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'schoolId=; path=/; max-age=0; SameSite=Lax';
}

/* ── Request: attach x-draft-token or Authorization header ─────── */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isRegistrationEndpoint = typeof config.url === 'string' && config.url.startsWith('/registration/');

  if (config.url === SCHOOL_INFO_URL) {
    // Draft does not exist yet — never attach a token for this route.
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
    if (authToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Attach school context header for school-scoped endpoints
    const schoolId = getSchoolId();
    if (schoolId && !config.headers['x-school-id']) {
      config.headers['x-school-id'] = schoolId;
    }
  }

  return config;
});

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

    /* ── Auth-session expiry detection (401 on app endpoints) ──── */
    const isAuthEndpoint =
      typeof config?.url === 'string' &&
      config.url.startsWith('/auth/');

    if (!isRegistrationEndpoint && !isAuthEndpoint && status === 401) {
      clearAuthCookie();
      useAuthStore.getState().setAuthenticated(false);
      useAuthStore.getState().clearUser();

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const currentPath = window.location.pathname;
        const search      = window.location.search;
        const callbackUrl = encodeURIComponent(`${currentPath}${search}`);
        window.location.href = `/login?callbackUrl=${callbackUrl}`;
      }
    }

    /* ── Standard error normalisation ────────────────────────── */

    const message =
      backendMsg ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  },
);

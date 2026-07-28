/**
 * Axios interceptors
 *
 * Imported as a side-effect from QueryProvider — runs once at module load.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ REQUEST interceptor                                             │
 * │                                                                 │
 * │ Reads the draft token from the onboarding store and attaches   │
 * │ x-draft-token to every outgoing request — EXCEPT the school-   │
 * │ info endpoint, which creates the draft and must not carry a     │
 * │ token (none exists at that point, and the backend would reject  │
 * │ a token on that route even if one were sent).                   │
 * └─────────────────────────────────────────────────────────────────┘
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

/* ── Request: attach x-draft-token, skip school-info ─────────── */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url === SCHOOL_INFO_URL) {
    // Draft does not exist yet — never attach a token for this route.
    return config;
  }

  const draftToken = useOnboardingStore.getState().draftToken;
  if (draftToken) {
    config.headers['x-draft-token'] = draftToken;
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

    /* ── Standard error normalisation ────────────────────────── */

    const message =
      backendMsg ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  },
);

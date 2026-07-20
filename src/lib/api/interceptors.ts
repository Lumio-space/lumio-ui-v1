/**
 * Axios interceptors
 *
 * Imported as a side-effect from QueryProvider — runs once at module load.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ REQUEST interceptor                                             │
 * │ Reads the draft token from the onboarding store and attaches   │
 * │ x-draft-token to every outgoing request.  Developers never     │
 * │ pass the token manually.                                        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ RESPONSE interceptor — error normalisation + draft recovery     │
 * │                                                                 │
 * │ For all errors:                                                 │
 * │   Normalises Axios errors into plain Error objects, surfacing   │
 * │   the backend's message field when available.                   │
 * │                                                                 │
 * │ For draft-related errors (expired / invalid / not found):       │
 * │   1. Clears the stored draft.                                   │
 * │   2. Creates a new draft via a direct axios call (avoids        │
 * │      re-entering this interceptor).                             │
 * │   3. Retries the original request exactly once with the new     │
 * │      x-draft-token.                                             │
 * │                                                                 │
 * │ The _isRetry flag prevents infinite retry loops.               │
 * │ Draft creation itself is excluded from recovery to avoid        │
 * │ recursion.                                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { apiClient }          from './axios';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { CreateDraftResponse } from '@/features/onboarding/types';

/* ── Type augmentation — adds _isRetry to Axios request config ── */

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** True when this request is a recovery retry. Prevents loops. */
    _isRetry?: boolean;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── Request: attach x-draft-token when a draft is in progress ── */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const draftToken = useOnboardingStore.getState().draftToken;
  if (draftToken) {
    config.headers['x-draft-token'] = draftToken;
  }
  return config;
});

/* ── Response: error normalisation + automatic draft recovery ─── */

apiClient.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const config        = error.config;
    const status        = error.response?.status;
    const responseData  = error.response?.data as { message?: string } | undefined;
    const backendMsg    = responseData?.message ?? '';

    /* ── Draft-error detection ──────────────────────────────────
     *
     * Conditions for attempting recovery:
     *   • The request is a registration endpoint (not the draft-
     *     creation endpoint itself, to avoid recursion).
     *   • The request has not already been retried (_isRetry falsy).
     *   • The error looks like a draft problem:
     *       - HTTP 401 / 410 from a registration route
     *       - Backend message that mentions draft + expired/invalid/not found
     *       - Backend message that mentions expired/invalid + draft/token
     */
    const isRegistrationEndpoint =
      typeof config?.url === 'string' &&
      config.url.startsWith('/registration/') &&
      config.url !== '/registration/drafts';   // exclude draft creation

    const isDraftRelatedError =
      isRegistrationEndpoint &&
      !config?._isRetry &&
      (status === 401 ||
       status === 410 ||
       /draft.*(expired|invalid|not found)/i.test(backendMsg) ||
       /(expired|invalid).*(draft|token)/i.test(backendMsg));

    if (isDraftRelatedError && config) {
      const store = useOnboardingStore.getState();
      store.clearDraft();

      try {
        /*
         * Use raw axios (not apiClient) for draft creation to avoid
         * re-entering this interceptor. A fresh instance with explicit
         * headers is semantically equivalent to a "bare" HTTP call.
         */
        const createResponse = await axios.post<CreateDraftResponse>(
          `${API_URL}/registration/drafts`,
          undefined,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30_000,
          },
        );

        const { draftToken, currentStep } = createResponse.data;
        store.setDraft(draftToken, currentStep);

        /*
         * Retry the original request exactly once.
         * _isRetry prevents this path from being entered again.
         * The request interceptor will read the new token from the store
         * and attach it automatically.
         */
        const retryConfig: InternalAxiosRequestConfig = {
          ...config,
          _isRetry: true,
        };

        return apiClient.request(retryConfig);

      } catch {
        /*
         * Only the draft-creation axios.post can throw here.
         * If apiClient.request(retryConfig) fails, its rejection
         * propagates naturally through the Promise chain without
         * being caught here (because we return, not await, it).
         */
        return Promise.reject(
          new Error(
            'Your registration session has expired and could not be recovered. ' +
            'Please refresh the page to start again.',
          ),
        );
      }
    }

    // Standard error normalisation 

    const message =
      backendMsg ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  },
);

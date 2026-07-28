'use client';

/**
 * useInitializeDraft
 *
 * Handles the registration draft lifecycle on wizard mount.
 *
 * With the new backend contract (POST /registration/drafts removed),
 * drafts are no longer created up-front — they are created automatically
 * when the school-info step is submitted (useSchoolInfo).
 *
 * This hook's responsibilities are now:
 *
 * Case 1 — No draft in store (fresh start)
 *   No async work needed. The wizard starts at step 1; the draft is
 *   created when the user submits school info.
 *   → return wasReset: false, isReady: true immediately
 *
 * Case 2 — Expired draft in store (createdAt > 48 h)
 *   Clear the persisted state. The user must re-enter school info
 *   (step 1) because we cannot recover a draft without that endpoint.
 *   → clear store, return wasReset: true, isReady: true
 *
 * Case 3 — Valid draft in store (within 48 h) — resume
 *   Sync the authoritative currentStep from the backend so the wizard
 *   can restore the user to exactly where they left off.
 *   → GET /registration/drafts → setCurrentStep → return wasReset: false
 *
 * Duplicate-request prevention
 * ────────────────────────────
 * useQuery with staleTime: Infinity ensures this queryFn runs at most
 * once per tab session, regardless of re-renders or React Strict Mode.
 *
 * Multi-tab
 * ─────────
 * Zustand persist synchronises the store across tabs via storage events.
 * Tab 2 that opens while Tab 1 has an active draft will find the token
 * in the store (Case 3) and resume rather than starting fresh.
 */

import { useQuery }                       from '@tanstack/react-query';
import { useOnboardingStore, isDraftExpired } from '@/stores/onboarding.store';
import { getDraft }                       from '../api/registration.api';

/* ── Query key — exported so the wizard can remove it on completion ── */
export const DRAFT_INIT_QUERY_KEY = ['registration', 'draft', 'init'] as const;

interface InitDraftResult {
  draftToken:  string | null;
  currentStep: string | null;
  /** True when the local draft was cleared (expiry) and step must reset. */
  wasReset:    boolean;
}

export function useInitializeDraft() {
  const query = useQuery<InitDraftResult, Error>({
    queryKey: DRAFT_INIT_QUERY_KEY,

    queryFn: async (): Promise<InitDraftResult> => {
      // Always read fresh state — avoids stale closure captures.
      const state = useOnboardingStore.getState();

      /* Case 1 — No draft: nothing to do ───────────────────────── */
      if (!state.draftToken) {
        return { draftToken: null, currentStep: null, wasReset: false };
      }

      /* Case 2 — Expired draft: clear and restart ──────────────── */
      if (isDraftExpired(state.createdAt)) {
        state.clearDraft();
        return { draftToken: null, currentStep: null, wasReset: true };
      }

      /* Case 3 — Valid draft: sync backend step ────────────────── */
      const data = await getDraft();
      useOnboardingStore.getState().setCurrentStep(data.currentStep);
      return { draftToken: state.draftToken, currentStep: data.currentStep, wasReset: false };
    },

    staleTime:            Infinity, // never refetch within a tab session
    gcTime:               Infinity, // keep in memory until explicitly removed
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    retry:                1,
    retryDelay:           1_500,
  });

  return {
    isLoading:     query.isLoading,
    isReady:       query.isSuccess,
    draftToken:    query.data?.draftToken   ?? useOnboardingStore.getState().draftToken,
    currentStep:   query.data?.currentStep  ?? useOnboardingStore.getState().currentStep,
    error:         query.error,
    draftWasReset: query.data?.wasReset ?? false,
  };
}

'use client';

/**
 * useInitializeDraft
 *
 * The single entry-point for the registration draft lifecycle.
 * Called once by OnboardingWizard on mount.
 *
 * Behaviour on every call
 * ───────────────────────
 *
 * Case 1 — Expired draft in store (createdAt > 48 h)
 *   → clear the store
 *   → POST /registration/drafts  (create fresh)
 *   → store token + step + timestamp
 *   → return wasReset: true  (wizard clears transient logo state)
 *
 * Case 2 — Valid draft in store (within 48 h)
 *   → GET /registration/drafts  (sync server state)
 *   → update currentStep in store  (enables accurate resume)
 *   → return wasReset: false
 *
 * Case 3 — No draft in store
 *   → POST /registration/drafts  (create fresh)
 *   → store token + step + timestamp
 *   → return wasReset: true
 *
 * Duplicate-request prevention
 * ────────────────────────────
 * Uses useQuery with staleTime: Infinity so React Query caches the result
 * in-memory for the lifetime of the tab. This prevents duplicate draft
 * creation caused by:
 *   • Component re-renders
 *   • React Strict Mode (double-invoke)
 *   • Multiple consumers calling this hook
 *
 * Each page-load triggers the queryFn exactly once (the in-memory cache
 * is cleared on refresh, but the persisted store is read first so the
 * network call is GET — not POST — when a valid draft exists).
 *
 * Multi-tab
 * ─────────
 * Zustand's persist middleware automatically synchronises the store across
 * tabs via the storage event. Both tabs share the same draftToken and
 * this hook will find it in the store on initialisation, issuing a GET
 * instead of a POST and never creating a competing draft.
 *
 * Resume
 * ──────
 * When a valid draft exists, the hook calls GET /registration/drafts to
 * retrieve the authoritative currentStep. The wizard maps this to a step
 * number and advances to it, so returning users continue exactly where
 * they left off.
 */

import { useQuery }             from '@tanstack/react-query';
import { useOnboardingStore, isDraftExpired } from '@/stores/onboarding.store';
import { createDraft, getDraft } from '../api/registration.api';

// Query key — exported so the wizard can invalidate on completion 
export const DRAFT_INIT_QUERY_KEY = ['registration', 'draft', 'init'] as const;

interface InitDraftResult {
  draftToken:  string;
  currentStep: string;
  wasReset:    boolean;
}

export function useInitializeDraft() {
  const query = useQuery<InitDraftResult, Error>({
    queryKey: DRAFT_INIT_QUERY_KEY,

    queryFn: async (): Promise<InitDraftResult> => {
      
      const state = useOnboardingStore.getState();

     
      if (state.draftToken && isDraftExpired(state.createdAt)) {
        state.clearDraft();
        const data = await createDraft();
        useOnboardingStore.getState().setDraft(data.draftToken, data.currentStep);
        return { draftToken: data.draftToken, currentStep: data.currentStep, wasReset: true };
      }

     
      if (state.draftToken) {
        const data = await getDraft();
        useOnboardingStore.getState().setCurrentStep(data.currentStep);
        return { draftToken: state.draftToken, currentStep: data.currentStep, wasReset: false };
      }


      const data = await createDraft();
      useOnboardingStore.getState().setDraft(data.draftToken, data.currentStep);
      return { draftToken: data.draftToken, currentStep: data.currentStep, wasReset: true };
    },

    staleTime:          Infinity,  
    gcTime:             Infinity,  
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    retry:              1,
    retryDelay:         1_500,
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

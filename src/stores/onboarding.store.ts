/**
 * Onboarding Store — persisted
 *
 * Holds registration draft state that must survive page refresh, browser
 * restart, and accidental tab close. Uses the same persist + safe-SSR
 * storage pattern as auth.store.ts.
 *
 * Persisted fields:  draftToken · currentStep · createdAt
 * Storage key:       'lumio-onboarding'
 *
 * Draft lifecycle
 * ───────────────
 * Created   → setDraft(token, step) — records token, step, and timestamp
 * Step sync → setCurrentStep(step)  — updates the step as the user progresses
 * Completed → clearDraft()          — wipes all persisted state
 * Expired   → isDraftExpired()      — checked on every initialization
 *
 * Multi-tab
 * ─────────
 * Zustand's persist middleware subscribes to the storage event, so draft
 * state is automatically synchronised across tabs in the same browser.
 * Both tabs share the same draftToken and never create competing drafts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** How long a registration draft remains valid (48 hours). */
export const DRAFT_TTL_MS = 48 * 60 * 60 * 1_000;

/** Returns true when the stored timestamp is older than DRAFT_TTL_MS. */
export function isDraftExpired(createdAt: number | null): boolean {
  if (createdAt === null) return true;
  return Date.now() - createdAt > DRAFT_TTL_MS;
}

/* ── SSR-safe storage fallback ────────────────────────────────── */

const safeStorage = {
  getItem:    () => null,
  setItem:    () => undefined,
  removeItem: () => undefined,
} as const;

/* ── Store interface ──────────────────────────────────────────── */

interface OnboardingState {
  /** JWT-style token identifying the active registration draft. */
  draftToken:  string | null;
  /** Backend's name for the current onboarding step (e.g. "school_info"). */
  currentStep: string | null;
  /** Unix timestamp (ms) when the draft was first created. */
  createdAt:   number | null;

  /**
   * Record a freshly created draft.
   * Sets the token, the initial backend step, and the creation timestamp.
   */
  setDraft: (token: string, step: string) => void;

  /**
   * Update the current step without touching the token or timestamp.
   * Called when the user advances through the wizard or when the backend
   * returns a different step on resume.
   */
  setCurrentStep: (step: string) => void;

  /**
   * Wipe all draft state from memory and from localStorage.
   * Must be called on registration completion and when a draft expires.
   */
  clearDraft: () => void;
}

/* ── Store ────────────────────────────────────────────────────── */

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draftToken:  null,
      currentStep: null,
      createdAt:   null,

      setDraft: (token, step) =>
        set({ draftToken: token, currentStep: step, createdAt: Date.now() }),

      setCurrentStep: (step) => set({ currentStep: step }),

      clearDraft: () => set({ draftToken: null, currentStep: null, createdAt: null }),
    }),
    {
      name: 'lumio-onboarding',
      /** Only persist the three runtime values — actions are reconstructed. */
      partialize: (state) => ({
        draftToken:  state.draftToken,
        currentStep: state.currentStep,
        createdAt:   state.createdAt,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return safeStorage;
        }
        return window.localStorage;
      }),
    },
  ),
);

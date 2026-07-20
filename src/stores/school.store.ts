/**
 * School Store — Zustand (persisted)
 *
 * Holds school-level branding set during onboarding so the dashboard
 * can display the uploaded logo and school name without another API call.
 *
 * Phase 7: Replace with real API call to GET /schools/me on dashboard load.
 * The persist middleware stores to localStorage under 'lumio-school'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SchoolState {
  /** Base64 dataURL of the uploaded school logo. Null if not yet uploaded. */
  logoDataUrl: string | null;
  /** School display name populated on onboarding completion. */
  schoolName: string | null;
  setLogo:       (dataUrl: string | null) => void;
  setSchoolName: (name: string)           => void;
  clearSchool:   ()                       => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      logoDataUrl:   null,
      schoolName:    null,
      setLogo:       (dataUrl) => set({ logoDataUrl: dataUrl }),
      setSchoolName: (name)    => set({ schoolName: name }),
      clearSchool:   ()        => set({ logoDataUrl: null, schoolName: null }),
    }),
    { name: 'lumio-school' }
  )
);

/**
 * Auth Store — Zustand (with persistence)
 *
 * Holds client-side auth state: the active role for the role switcher
 * (dev tool), and will store session tokens once next-auth is wired
 * in Phase 2.
 *
 * This replaces RoleContext from the original project.
 * The `persist` middleware writes to localStorage under 'lumio-auth'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LegacyRole } from '@/types/auth.types';

interface AuthState {
  /**
   * Active role for the dev role-switcher.
   * Phase 2 will replace this with the real session user role.
   */
  role: LegacyRole;
  setRole: (role: LegacyRole) => void;

  /** Whether the user is authenticated (will be derived from session in Phase 2) */
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role:    'admin',
      setRole: (role) => set({ role }),

      isAuthenticated:    false,
      setAuthenticated:   (value) => set({ isAuthenticated: value }),
    }),
    {
      name: 'lumio-auth',
      // Only persist the role — don't persist loading states
      partialize: (state) => ({ role: state.role }),
    }
  )
);

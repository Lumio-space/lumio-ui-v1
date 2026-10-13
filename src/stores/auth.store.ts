import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { normalizeRole, type UserRole } from '@/types/auth.types'

const safeStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

export interface AuthUser {
  id?:       string
  name:      string
  email:     string
  role?:     string
  schoolId?: string
  classId?:  string
}

interface AuthState {
  role:             UserRole
  isAuthenticated:  boolean
  setAuthenticated: (value: boolean) => void
  /** Populated by useLogin / OnboardingWizard on completion; read by Topbar. */
  user:             AuthUser | null
  setUser:          (user: AuthUser | null) => void
  clearUser:        () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role:             'admin',
      isAuthenticated:  false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      user:             null,
      setUser:          (user) => {
        const canonicalRole = normalizeRole(user?.role) ?? 'admin';
        set({
          user,
          role: canonicalRole,
          isAuthenticated: !!user,
        });
      },
      clearUser: () => {
        set({
          user: null,
          role: 'admin',
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.removeItem('lumio-auth');
          } catch {
            // ignore
          }
        }
      },
    }),
    {
      name: 'lumio-auth',
      partialize: (state) => ({ role: state.role, user: state.user }),
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return safeStorage
        }

        return window.localStorage
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.role = normalizeRole(state.user.role) ?? 'admin';
          state.isAuthenticated = true;
        }
      },
    }
  )
)

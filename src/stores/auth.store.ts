import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LegacyRole } from '@/types/auth.types'

const safeStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

interface AuthUser {
  name:      string
  email:     string
  role?:     string
  schoolId?: string
}

interface AuthState {
  role:             LegacyRole
  setRole:          (role: LegacyRole) => void
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
      setRole:          (role) => set({ role }),
      isAuthenticated:  false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      user:             null,
      setUser:          (user) => set({ user }),
      clearUser:        () => set({ user: null }),
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
    }
  )
)

'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

import {
  loginUser,
  logoutUser,
  forgotPassword,
} from '../services/auth.api'

import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password.schema'

function setAuthCookie(token: string, remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function clearAuthCookie() {
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
}

export function useLogin() {
  const router = useRouter()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginUser(values),
    onSuccess: (data, variables) => {
      setAuthCookie(data.token, variables.rememberMe ?? false)
      setAuthenticated(true)
      setUser({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      })
      router.push('/dashboard')
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const clearUser = useAuthStore((s) => s.clearUser)

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearAuthCookie()
      setAuthenticated(false)
      clearUser()
      router.push('/login')
    },
    onError: () => {
      clearAuthCookie()
      setAuthenticated(false)
      clearUser()
      router.push('/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      forgotPassword(values),
  })
}

/** Cookie helper — exported so the OnboardingWizard can set auth on completion. */
export { setAuthCookie }
'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/types/auth.types'

import {
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword
} from '../services/auth.api'

import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password.schema'
import type { ResetPasswordFormValues } from "@/features/auth/schemas/reset-password.schema";

type ResetPasswordMutationValues = Pick<ResetPasswordFormValues, 'newPassword'> & {
  token: string
}

function setAuthCookie(token: string | null | undefined, remember: boolean) {
  if (!token || token === 'undefined' || token === 'null') {
    return;
  }
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function setSchoolCookie(schoolId: string | null | undefined, remember: boolean = false) {
  if (!schoolId || schoolId === 'undefined' || schoolId === 'null') {
    return;
  }
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  document.cookie = `schoolId=${schoolId}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function clearSchoolCookie() {
  document.cookie = 'schoolId=; path=/; max-age=0; SameSite=Lax'
}

function clearAuthCookie() {
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
  clearSchoolCookie()
}

export function useLogin() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setUser          = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginUser(values),
    onSuccess: (data, variables) => {
      const token = data.token || data.accessToken
      if (token) {
        setAuthCookie(token, variables.rememberMe ?? false)
        setAuthenticated(true)
      }

      const user = data.user
      const role =
        user?.role ||
        (data.memberships?.[0]?.role as Role) ||
        'SCHOOL_ADMIN'
      const name = user?.name || user?.fullName || user?.email?.split('@')[0] || 'User'
      const schoolId =
        user?.schoolId ||
        data.memberships?.[0]?.schoolId

      if (schoolId) {
        setSchoolCookie(schoolId, variables.rememberMe ?? false)
      }

      setUser({
        name,
        email: user?.email ?? '',
        role,
        schoolId,
      })

      const callbackUrl = searchParams?.get('callbackUrl')
      const destination =
        callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard'
      router.push(destination)
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

export function useForgotPassword(options?: {
  onSuccess?: () => void
  onError?: () => void
}) {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
        forgotPassword(values),

    onSuccess: () => {
      options?.onSuccess?.()
    },

    onError: () => {
      options?.onError?.()
    },
  })
}

export function useResetPassword(options?: {
  onSuccess?: () => void
  onError?: () => void
}) {
  return useMutation({
    mutationFn: ( values: ResetPasswordMutationValues) =>
        resetPassword(values.token, values),

    onSuccess: () => {
      options?.onSuccess?.()
    },

    onError: () => {
      options?.onError?.()
    },
  })
}


/** Cookie helpers — exported so the OnboardingWizard can set auth on completion. */
export { setAuthCookie, setSchoolCookie, clearSchoolCookie }
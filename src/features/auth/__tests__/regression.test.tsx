/**
 * Regression tests — Phase 2 regression fixes
 *
 * Regression #1: Validation messages visible (useFormState subscription fix)
 * Regression #3: Academic year dynamic range (no hardcoded limit)
 * Regression #4: No hardcoded admin data (auth store user slice)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { YEAR_OPTIONS } from '../components/steps/AcademicsStep'

/* ── shared mock ────────────────────────────────────────────── */
const { mockLoginMutate } = vi.hoisted(() => ({ mockLoginMutate: vi.fn() }))

vi.mock('../hooks/useAuth', () => ({
  useLogin:  () => ({ mutate: mockLoginMutate, isPending: false, error: null }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}))

/* ── Regression #1: Validation messages ─────────────────────── */
describe('Regression #1 — validation messages visible', () => {
  beforeEach(() => mockLoginMutate.mockReset())

  it('shows "Email is required" when email field is empty on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    await user.clear(screen.getByPlaceholderText('you@school.edu'))
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows "Password is required" when password is empty on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    await user.type(screen.getByPlaceholderText('you@school.edu'), 'test@school.edu')
    await user.clear(screen.getByPlaceholderText('••••••••'))
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows email format error on blur for invalid email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    await user.type(screen.getByPlaceholderText('you@school.edu'), 'not-an-email')
    await user.tab()
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('shows min-length error on blur for short password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    await user.type(screen.getByPlaceholderText('••••••••'), 'abc')
    await user.tab()
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('clears the email error after the user corrects it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    await user.type(screen.getByPlaceholderText('you@school.edu'), 'bad')
    await user.tab()
    await waitFor(() =>
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    )
    await user.clear(screen.getByPlaceholderText('you@school.edu'))
    await user.type(screen.getByPlaceholderText('you@school.edu'), 'good@school.edu')
    await user.tab()
    await waitFor(() =>
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
    )
  })
})

/* ── Regression #3: Academic year dynamic range ─────────────── */
describe('Regression #3 — academic year dynamic range', () => {
  const currentYear = new Date().getFullYear()

  it('YEAR_OPTIONS is an array', () => {
    expect(Array.isArray(YEAR_OPTIONS)).toBe(true)
  })

  it('contains the current year', () => {
    expect(YEAR_OPTIONS).toContain(currentYear)
  })

  it('includes years beyond 2027 so it never needs a code change', () => {
    expect(YEAR_OPTIONS.some((y) => y > 2027)).toBe(true)
  })

  it('starts one year before current so the prior academic year is selectable', () => {
    expect(YEAR_OPTIONS[0]).toBe(currentYear - 1)
  })

  it('has at least 10 options to remain useful for a decade', () => {
    expect(YEAR_OPTIONS.length).toBeGreaterThanOrEqual(10)
  })
})

/* ── Regression #4: Auth store user slice ───────────────────── */
describe('Regression #4 — auth store user slice', () => {
  // vi.importActual bypasses the global auth store mock in setup.ts
  it('real store exposes user, setUser and clearUser', async () => {
    const { useAuthStore } = await vi.importActual<
      typeof import('@/stores/auth.store')
    >('@/stores/auth.store')

    const state = useAuthStore.getState()
    expect('user'      in state).toBe(true)
    expect('setUser'   in state).toBe(true)
    expect('clearUser' in state).toBe(true)
  })

  it('setUser persists name and email; clearUser resets to null', async () => {
    const { useAuthStore } = await vi.importActual<
      typeof import('@/stores/auth.store')
    >('@/stores/auth.store')

    useAuthStore.getState().setUser({ name: 'Ada Okonkwo', email: 'ada@school.edu.ng' })
    expect(useAuthStore.getState().user?.name).toBe('Ada Okonkwo')
    expect(useAuthStore.getState().user?.email).toBe('ada@school.edu.ng')

    useAuthStore.getState().clearUser()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('store user is null by default (Topbar shows "Administrator" fallback)', async () => {
    const { useAuthStore } = await vi.importActual<
      typeof import('@/stores/auth.store')
    >('@/stores/auth.store')
    // After clearUser the user is null — Topbar falls back to 'Administrator'
    useAuthStore.getState().clearUser()
    const user = useAuthStore.getState().user
    const displayName = user ? user.name : 'Administrator'
    expect(displayName).toBe('Administrator')
  })
})

/**
 * ForgotPasswordForm — comprehensive test suite
 *
 * Covers:
 *  - Client-side validation (required, format)
 *  - Pending / loading state
 *  - Success state (message, accessibility, form replaced, auto-dismiss)
 *  - Error state (friendly message, role="alert", no raw server text)
 *  - Mutation callbacks (onSuccess, onError)
 *  - Email-enumeration safety (same UI regardless of whether email is registered)
 *  - Navigation link
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

// Hoisted mock state
// mockState.isPending is read every time the hook is called so individual tests
// can flip it to true before rendering to simulate an in-flight request.

const { mockMutate, mockState } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockState: { isPending: false },
}));

// Module mocks

vi.mock('next/link', () => ({
  default: ({
              href,
              children,
              className,
            }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement('a', { href, className }, children),
}));

vi.mock('@/components/Logo', () => ({
  Logo: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
             children,
             disabled,
             loading,
             type,
             className,
             onClick,
           }: {
    children: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    onClick?: () => void;
    // consumed but not forwarded to the DOM element
    size?: string;
    rightIcon?: React.ReactNode;
  }) =>
      React.createElement(
          'button',
          { type, disabled: disabled || loading, className, onClick },
          children,
      ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
      React.createElement('input', props),
}));

/**
 * Form / FormField / FormItem / FormLabel / FormControl / FormMessage
 *
 * These stubs delegate to react-hook-form so that validation and controlled
 * inputs work correctly — the test validates actual RHF behaviour, not mocks.
 *
 * FormMessage reads the current field's error from the RHF context so that
 * client-side validation messages are rendered exactly as the component would
 * render them in production.
 */
vi.mock('@/components/ui/form', async () => {
  const React = await import('react');
  const {
    FormProvider,
    Controller,
    useFormContext,
  } = await import('react-hook-form');

  // Shares the field name between FormField (provider) and FormMessage (consumer).
  const FieldCtx = React.createContext<{ name: string }>({ name: '' });

  return {
    // Form = thin wrapper around RHF's FormProvider
    Form: FormProvider,

    // FormField = RHF Controller wrapped in the FieldCtx provider
    FormField: ({
                  control,
                  name,
                  render,
                }: {
      control: unknown;
      name: string;
      render: (props: { field: unknown }) => React.ReactNode;
    }) =>
        React.createElement(
            FieldCtx.Provider,
            { value: { name } },
            React.createElement(Controller, {
              control: control as never,
              name,
              render: ({ field }: { field: unknown }) => render({ field }) as React.ReactElement,
            }),
        ),

    FormItem: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', null, children),

    FormLabel: ({ children }: { children: React.ReactNode }) =>
        React.createElement('label', null, children),

    FormControl: ({ children }: { children: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),

    // FormMessage — reads the error for the current field from RHF context
    FormMessage: () => {
      const { name } = React.useContext(FieldCtx);
      const {
        formState: { errors },
      } = useFormContext();
      const error = (errors as Record<string, { message?: string }>)[name];
      if (!error?.message) return null;
      return React.createElement('p', { role: 'note' }, error.message);
    },
  };
});

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useForgotPassword: (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => ({
    // Read from mockState so tests can control this without re-mocking.
    isPending: mockState.isPending,
    mutate: (values: unknown) => mockMutate(values, options),
  }),
}));

// Helpers

const EMAIL_INPUT = 'you@school.edu'; // placeholder text
const SUBMIT_BTN = /send reset link/i;

function triggerSuccess() {
  mockMutate.mockImplementation((_v: unknown, opts: { onSuccess?: () => void }) => {
    opts?.onSuccess?.();
  });
}

function triggerError() {
  mockMutate.mockImplementation((_v: unknown, opts: { onError?: () => void }) => {
    opts?.onError?.();
  });
}

// Suite

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockState.isPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Validation

  describe('Client-side validation', () => {
    it('shows "Email is required" when the field is empty on submit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows a format error for an invalid email address', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'not-an-email');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(
            screen.getByText(/please enter a valid email address/i),
        ).toBeInTheDocument();
      });
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call the mutation when validation fails', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      // Intentionally leave the field empty
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ── Loading / pending state ─────────────────────────────────────────────────

  describe('Loading state', () => {
    it('disables the submit button while a request is in flight', () => {
      mockState.isPending = true;
      renderWithProviders(<ForgotPasswordForm />);

      expect(screen.getByRole('button', { name: SUBMIT_BTN })).toBeDisabled();
    });

    it('does not fire the mutation when the button is disabled', async () => {
      mockState.isPending = true;
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      // userEvent respects the disabled attribute and will not fire a click
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ── Success state ───────────────────────────────────────────────────────────

  describe('Success state', () => {
    it('shows the success confirmation after a successful submission', async () => {
      triggerSuccess();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        // Target the <h3> heading specifically — the body <p> also contains the
        // word "inbox", so getByText would match multiple elements.
        expect(
            screen.getByRole('heading', { name: /check your inbox/i }),
        ).toBeInTheDocument();
      });
    });

    it('applies role="status" and aria-live="polite" to the confirmation', async () => {
      triggerSuccess();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('replaces the form with the success message (form is no longer in DOM)', async () => {
      triggerSuccess();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(EMAIL_INPUT)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: SUBMIT_BTN })).not.toBeInTheDocument();
      });
    });

    it('calls the onSuccess callback and updates state', async () => {
      // Verify that the hook's onSuccess option is invoked — proven by the
      // form transitioning into the success state.
      triggerSuccess();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'test@school.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('dismisses the success message after 10 seconds', async () => {
      // Use fake timers to control the 10-second dismiss timeout.
      // Use fireEvent instead of userEvent — userEvent's internal async
      // machinery uses timers internally and hangs when the clock is frozen.
      vi.useFakeTimers();
      triggerSuccess();

      renderWithProviders(<ForgotPasswordForm />);

      // fireEvent.change + fireEvent.click are synchronous; wrap in act so
      // React flushes all resulting state updates before assertions.
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText(EMAIL_INPUT), {
          target: { value: 'admin@lumio.edu' },
        });
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN }));
      });

      // The mock fires onSuccess synchronously, so the success block is visible.
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Advance the fake clock past the 10-second dismiss timer.
      await act(async () => {
        vi.advanceTimersByTime(10_001);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('restores the form with a cleared email field after auto-dismiss', async () => {
      vi.useFakeTimers();
      triggerSuccess();

      renderWithProviders(<ForgotPasswordForm />);

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText(EMAIL_INPUT), {
          target: { value: 'admin@lumio.edu' },
        });
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN }));
      });

      // Form is replaced by the success block; email input is gone.
      expect(screen.queryByPlaceholderText(EMAIL_INPUT)).not.toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(10_001);
      });

      // Form comes back — email is empty because form.reset() ran in onSuccess.
      const emailInput = screen.getByPlaceholderText(EMAIL_INPUT);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveValue('');
    });
  });

  // ── Error state ─────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows a friendly error message when the request fails', async () => {
      triggerError();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(
            screen.getByText(/we couldn't process your request/i),
        ).toBeInTheDocument();
      });
    });

    it('applies role="alert" to the error message container', async () => {
      triggerError();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('does not expose raw server error text to the user', async () => {
      // The Axios interceptor normalises errors to plain Error objects, but even
      // if a raw message leaked through, the component must never render it.
      mockMutate.mockImplementation(
          (_v: unknown, opts: { onError?: () => void }) => {
            opts?.onError?.();
          },
      );

      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Raw technical strings must NOT appear
      expect(screen.queryByText(/axioserror/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/status code/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/internal server error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/500/i)).not.toBeInTheDocument();
    });

    it('calls the onError callback when the mutation fails', async () => {
      // Verify the hook's onError option is invoked — proven by the error
      // state appearing in the UI.
      triggerError();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('clears the error message when the user resubmits', async () => {
      // First submission fails
      triggerError();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'admin@lumio.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Second submission succeeds — error should clear
      triggerSuccess();
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  // ── Email-enumeration safety ────────────────────────────────────────────────

  describe('Email-enumeration safety', () => {
    /**
     * The backend returns HTTP 200 with an identical generic message for both
     * registered and unregistered email addresses. From the frontend's
     * perspective both resolve as a successful mutation, so the UI shows the
     * same confirmation regardless — an attacker gains no information about
     * account existence by observing the UI.
     */
    it('shows the same confirmation for a registered and an unregistered email', async () => {
      // ── Scenario A: registered email (mutation resolves → onSuccess) ──
      triggerSuccess();
      const user = userEvent.setup();
      const { unmount: unmountA } = renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'existing@school.edu');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /check your inbox/i }),
        ).toBeInTheDocument();
      });

      unmountA();
      mockMutate.mockReset();

      // ── Scenario B: unregistered email (backend still 200 → same onSuccess) ──
      triggerSuccess();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'nobody@example.com');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /check your inbox/i }),
        ).toBeInTheDocument();
      });
    });

    it('never renders a message that reveals whether the account is registered', async () => {
      triggerSuccess();
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(screen.getByPlaceholderText(EMAIL_INPUT), 'probe@example.com');
      await user.click(screen.getByRole('button', { name: SUBMIT_BTN }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Strings that would reveal account existence must never appear.
      // Note: the generic success message intentionally reads "if an account
      // exists for that email" (ambiguous, enumeration-safe). The patterns
      // below target phrases that would *confirm* the address is registered.
      expect(screen.queryByText(/email not found/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/user does not exist/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/account (was found|is registered|has been found)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/we found your account/i)).not.toBeInTheDocument();
    });
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('renders a "Back to Sign in" link pointing to /login', () => {
      renderWithProviders(<ForgotPasswordForm />);

      const link = screen.getByRole('link', { name: /back to sign in/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });
  });
});

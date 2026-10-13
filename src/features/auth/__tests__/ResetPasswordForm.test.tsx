import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

const { mockMutate, mockState } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockState: { isPending: false },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=test-reset-token'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) =>
    React.createElement(
      'a',
      { href, className },
      children,
    ),
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
  }) =>
    React.createElement(
      'button',
      {
        type,
        disabled: disabled || loading,
        className,
        onClick,
      },
      children,
    ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement('input', props),
}));

vi.mock('@/components/ui/form', async () => {
  const React = await import('react');
  const {
    FormProvider,
    Controller,
    useFormContext,
  } = await import('react-hook-form');

  const FieldCtx = React.createContext<{ name: string }>({ name: '' });

  return {
    Form: FormProvider,

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
          render: ({ field }: { field: unknown }) =>
            render({ field }) as React.ReactElement,
        }),
      ),

    FormItem: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),

    FormLabel: ({ children }: { children: React.ReactNode }) =>
      React.createElement('label', null, children),

    FormControl: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),

    FormMessage: () => {
      const { name } = React.useContext(FieldCtx);
      const {
        formState: { errors },
      } = useFormContext();

      const error = (
        errors as Record<string, { message?: string }>
      )[name];

      if (!error?.message) {
        return null;
      }

      return React.createElement(
        'p',
        { role: 'note' },
        error.message,
      );
    },
  };
});

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useResetPassword: (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => ({
    isPending: mockState.isPending,
    mutate: (values: unknown) => mockMutate(values, options),
  }),
}));

const NEW_PASSWORD = 'Password123!';
const CONFIRM_PASSWORD = 'Password123!';
const RESET_TOKEN = 'test-reset-token';

function getNewPasswordInput() {
  return document.querySelector(
    'input[name="newPassword"]',
  ) as HTMLInputElement;
}

function getConfirmPasswordInput() {
  return document.querySelector(
    'input[name="confirmPassword"]',
  ) as HTMLInputElement;
}

function getSubmitButton() {
  return screen.getByRole('button', {
    name: /reset password/i,
  });
}

function triggerSuccess() {
  mockMutate.mockImplementation(
    (
      _values: unknown,
      options: { onSuccess?: () => void },
    ) => {
      options?.onSuccess?.();
    },
  );
}

function triggerError() {
  mockMutate.mockImplementation(
    (
      _values: unknown,
      options: { onError?: () => void },
    ) => {
      options?.onError?.();
    },
  );
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockState.isPending = false;
    window.history.pushState(
      {},
      '',
      `/reset-password?token=${RESET_TOKEN}`,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the reset password form', () => {
      renderWithProviders(<ResetPasswordForm />);

      expect(
        screen.getByRole('heading', {
          name: /reset password/i,
        }),
      ).toBeInTheDocument();

      expect(getNewPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
      expect(getSubmitButton()).toBeInTheDocument();
    });

    it('renders the back to sign in link', () => {
      renderWithProviders(<ResetPasswordForm />);

      const link = screen.getByRole('link', {
        name: /back to sign in/i,
      });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });
  });

  describe('Client-side validation', () => {
    it('shows an error when the new password is empty', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByText(/password is required/i),
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows an error when the confirm password is empty', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByText('Please confirm your password'),
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows an error when passwords do not match', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        'DifferentPassword123!',
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByText(/passwords do not match/i),
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call the mutation when validation fails', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByText('Password is required'),
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('disables the submit button while the request is pending', () => {
      mockState.isPending = true;

      renderWithProviders(<ResetPasswordForm />);

      expect(getSubmitButton()).toBeDisabled();
    });

    it('does not submit while the request is pending', async () => {
      mockState.isPending = true;

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.click(getSubmitButton());

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Success state', () => {
    it('shows a success message after a successful reset', async () => {
      triggerSuccess();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

    waitFor(() => {
        expect(
          screen.getByRole('status'),
        ).toBeInTheDocument();
      });
    });

    it('shows a reset successful message', async () => {
      triggerSuccess();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      expect(
       await screen.findByText(/password reset successful/i)
     ).toBeInTheDocument()
    });

    it('uses an accessible status message', async () => {
      triggerSuccess();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        const status = screen.getByRole('status');

        expect(status).toHaveAttribute(
          'aria-live',
          'polite',
        );
      });
    });

    it('replaces the form after successful reset', async () => {
      triggerSuccess();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.queryByRole('button', {
            name: /reset password/i,
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('shows a friendly error message when the request fails', async () => {
      triggerError();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByRole('alert'),
        ).toBeInTheDocument();
      });
    });

    it('uses role alert for the error message', async () => {
      triggerError();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByRole('alert'),
        ).toBeInTheDocument();
      });
    });

    it('does not expose raw server error text', async () => {
      mockMutate.mockImplementation(
        (
          _values: unknown,
          options: { onError?: () => void },
        ) => {
          options?.onError?.();
        },
      );

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByRole('alert'),
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/axioserror/i),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText(/status code/i),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText(/internal server error/i),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText(/\b500\b/i),
      ).not.toBeInTheDocument();
    });

    it('clears the error when the user submits again', async () => {
      triggerError();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByRole('alert'),
        ).toBeInTheDocument();
      });

      triggerSuccess();

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.queryByRole('alert'),
        ).not.toBeInTheDocument();

        expect(
          screen.getByRole('status'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Reset token', () => {
    it('passes the reset token and new password to the mutation', async () => {
      mockMutate.mockImplementation(
        (values: {
          token?: string;
          newPassword?: string;
        }) => {
          expect(values).toEqual(
            expect.objectContaining({
              token: RESET_TOKEN,
              newPassword: NEW_PASSWORD,
            }),
          );
        },
      );

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Password visibility', () => {
    it('can show and hide the new password', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      const input = getNewPasswordInput();

      expect(input).toHaveAttribute(
        'type',
        'password',
      );

      const showButton = screen.getByRole('button', {
        name: /show new password/i,
      });

      await user.click(showButton);

      expect(input).toHaveAttribute(
        'type',
        'text',
      );

      const hideButton = screen.getByRole('button', {
        name: /hide new password/i,
      });

      await user.click(hideButton);

      expect(input).toHaveAttribute(
        'type',
        'password',
      );
    });

    it('can show and hide the confirm password', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      const input = getConfirmPasswordInput();

      expect(input).toHaveAttribute(
        'type',
        'password',
      );

      const showButton = screen.getByRole('button', {
        name: /show confirm password/i,
      });

      await user.click(showButton);

      expect(input).toHaveAttribute(
        'type',
        'text',
      );

      const hideButton = screen.getByRole('button', {
        name: /hide confirm password/i,
      });

      await user.click(hideButton);

      expect(input).toHaveAttribute(
        'type',
        'password',
      );
    });
  });

  describe('Form submission', () => {
    it('submits valid password values', async () => {
      triggerSuccess();

      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        CONFIRM_PASSWORD,
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
    });

    it('does not submit when passwords are different', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ResetPasswordForm />);

      await user.type(
        getNewPasswordInput(),
        NEW_PASSWORD,
      );

      await user.type(
        getConfirmPasswordInput(),
        'DifferentPassword123!',
      );

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(
          screen.getByText(/passwords do not match/i),
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });
});
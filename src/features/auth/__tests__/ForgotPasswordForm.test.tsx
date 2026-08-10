import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useForgotPassword: (options?: {
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  }) => ({
    isPending: false,
    mutate: (values: unknown) => {
      mockMutate(values, options);
    },
  }),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it('shows success confirmation after a successful submission', async () => {
    mockMutate.mockImplementation((_values, options) => {
      options?.onSuccess?.();
    });

    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText('you@school.edu'),
      'admin@lumio.edu'
    );

    await user.click(
      screen.getByRole('button', { name: /send reset link/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByText(/check your inbox/i)
      ).toBeInTheDocument();
    });
  });

  it('shows a friendly error message when the request fails', async () => {
    mockMutate.mockImplementation((_values, options) => {
      options?.onError?.(new Error('Server error'));
    });

    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText('you@school.edu'),
      'admin@lumio.edu'
    );

    await user.click(
      screen.getByRole('button', { name: /send reset link/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();

      expect(
        screen.getByText(
          /we couldn't process your request/i
        )
      ).toBeInTheDocument();
    });
  });
});
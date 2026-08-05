import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useForgotPassword: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => mockMutate.mockReset());

  it('renders email input', () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(
      screen.getByPlaceholderText('you@school.edu')
    ).toBeInTheDocument();
  });

  it('renders send reset link button', () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(
      screen.getByRole('button', { name: /send reset link/i })
    ).toBeInTheDocument();
  });

  it('renders back to sign in link', () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(
      screen.getByRole('link', { name: /back to sign in/i })
    ).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText('you@school.edu'),
      'invalid-email'
    );

    await user.click(
      screen.getByRole('button', { name: /send reset link/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('calls forgot password mutation with valid email', async () => {
    const user = userEvent.setup();

    const { container } =
      renderWithProviders(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText('you@school.edu'),
      'admin@lumio.edu'
    );

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'admin@lumio.edu',
      });
    });
  });

  it('does not call mutation when email is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordForm />);

    await user.click(
      screen.getByRole('button', { name: /send reset link/i })
    );

    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('submit button has type submit', () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(
      screen.getByRole('button', { name: /send reset link/i })
    ).toHaveAttribute('type', 'submit');
  });
});
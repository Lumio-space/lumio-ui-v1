/**
 * LoginForm — integration tests
 *
 * vi.hoisted ensures mockMutate is available when vi.mock's factory
 * runs (vi.mock is hoisted to top of file by Vitest, so any const
 * declared after it would be in the TDZ when the factory executes).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { LoginForm } from '@/features/auth/components/LoginForm';

// --- Hoist mocks so they're available inside vi.mock factory ---
const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }));

vi.mock('../hooks/useAuth', () => ({
  useLogin:  () => ({ mutate: mockMutate, isPending: false, error: null }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('LoginForm', () => {
  beforeEach(() => mockMutate.mockReset());

  it('renders email and password inputs', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByPlaceholderText('you@school.edu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the sign-in button', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to onboarding', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('link', { name: /set up your workspace/i })).toBeInTheDocument();
  });

  it('renders a remember me checkbox', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('shows validation error for invalid email on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@school.edu'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // With empty defaults, multiple fields may have errors at once.
    // Query by the specific message text to be precise.
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.clear(screen.getByPlaceholderText('••••••••'));
    await user.type(screen.getByPlaceholderText('••••••••'), 'abc');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('calls login mutation with typed values when form is valid', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginForm />);

    // Fill in credentials (defaults are now empty — correction #3)
    await user.type(screen.getByPlaceholderText('you@school.edu'), 'admin@lumio.edu');
    await user.type(screen.getByPlaceholderText('••••••••'), 'securepass');

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          email:    'admin@lumio.edu',
          password: 'securepass',
        })
      );
    });
  });

  it('does not call mutation when email is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.clear(screen.getByPlaceholderText('you@school.edu'));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockMutate).not.toHaveBeenCalled());
  });

  it('sign-in button has type submit', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveAttribute('type', 'submit');
  });
});

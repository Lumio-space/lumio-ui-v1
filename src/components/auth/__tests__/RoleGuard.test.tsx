import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { RoleGuard } from '../RoleGuard';
import { useAuthStore } from '@/stores/auth.store';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the user has an allowed role', async () => {
    useAuthStore.setState({
      role: 'admin',
      isAuthenticated: true,
      user: { name: 'Admin User', email: 'admin@school.edu', role: 'admin' },
    });

    renderWithProviders(
      <RoleGuard allowedRoles={['admin']}>
        <div>Protected Admin Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Admin Content')).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /dashboard and does not render children when user role is unauthorized', async () => {
    useAuthStore.setState({
      role: 'teacher',
      isAuthenticated: true,
      user: { name: 'Teacher User', email: 'teacher@school.edu', role: 'teacher' },
    });

    renderWithProviders(
      <RoleGuard allowedRoles={['admin']}>
        <div>Secret Admin Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
    expect(screen.queryByText('Secret Admin Content')).not.toBeInTheDocument();
  });
});

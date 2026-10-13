import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { AcceptInviteView } from '@/features/teachers';
import * as invitationsApi from '../api/invitations.api';
import { useAuthStore } from '@/stores/auth.store';

const { mockSearchParams, mockRouterPush } = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/accept-invite',
}));

describe('Invitation Role Isolation and Boundary Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      role: 'admin',
    });
  });

  it('strictly ignores URL tampering (e.g., ?role=admin&role=teacher) and derives role only from backend token verification', async () => {
    // Malicious attacker passes arbitrary role query params attempting privilege escalation
    mockSearchParams.mockReturnValue(
      new URLSearchParams('token=parent-secure-token&role=admin&privilege=superadmin')
    );

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'parent.user@domain.com',
      isExistingUser: false,
      role: 'parent', // Backend verified role
      schoolName: 'Secure High School',
      token: 'parent-secure-token',
      expiresAt: '2026-10-10T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // Must render as Parent invitation, never Admin
      expect(screen.getAllByText(/parent invitation/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/admin invitation/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/superadmin/i)).not.toBeInTheDocument();
      // Must not display teacher-specific form teacher content
      expect(screen.queryByText(/form teacher/i)).not.toBeInTheDocument();
    });
  });

  it('guarantees parent acceptance establishes parent role and cannot escalate to teacher or admin', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('token=parent-secure-token'));
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'parent.user@domain.com',
      isExistingUser: false,
      role: 'parent',
      schoolName: 'Secure High School',
      token: 'parent-secure-token',
      expiresAt: '2026-10-10T00:00:00.000Z',
    });

    vi.spyOn(invitationsApi, 'acceptNewUserInvitation').mockResolvedValue({
      user: {
        id: 'p-1',
        email: 'parent.user@domain.com',
        fullName: 'Parent User',
      },
      role: 'parent',
      schoolId: 'school-sec',
      accessToken: 'token-parent-jwt',
    });

    renderWithProviders(<AcceptInviteView initialStep="setup" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/first name/i), 'Parent');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/^password/i), 'SecureP@ss123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecureP@ss123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.role).toBe('parent');
      expect(authState.role).not.toBe('teacher');
      expect(authState.role).not.toBe('admin');
      expect(authState.user?.role).toBe('parent');
      expect(authState.user?.role).not.toBe('admin');
      expect(authState.user?.role).not.toBe('teacher');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('guarantees student acceptance establishes student role and cannot escalate to teacher or admin', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('token=student-secure-token'));
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'student.user@domain.com',
      isExistingUser: false,
      role: 'student',
      schoolName: 'Secure High School',
      token: 'student-secure-token',
      expiresAt: '2026-10-10T00:00:00.000Z',
    });

    vi.spyOn(invitationsApi, 'acceptNewUserInvitation').mockResolvedValue({
      user: {
        id: 's-1',
        email: 'student.user@domain.com',
        fullName: 'Student User',
      },
      role: 'student',
      schoolId: 'school-sec',
      accessToken: 'token-student-jwt',
    });

    renderWithProviders(<AcceptInviteView initialStep="setup" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/first name/i), 'Student');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/^password/i), 'SecureP@ss123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecureP@ss123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.role).toBe('student');
      expect(authState.role).not.toBe('teacher');
      expect(authState.role).not.toBe('admin');
      expect(authState.role).not.toBe('parent');
      expect(authState.user?.role).toBe('student');
      expect(authState.user?.role).not.toBe('teacher');
      expect(authState.user?.role).not.toBe('admin');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});

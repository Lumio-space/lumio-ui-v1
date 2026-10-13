import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { AcceptInviteView } from '@/features/teachers';
import * as invitationsApi from '../api/invitations.api';
import * as authApi from '@/features/auth/services/auth.api';
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

describe('Parent Invitation Acceptance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams('token=parent-valid-token'));
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      role: 'admin',
    });
  });

  it('renders Parent invitation details landing with parent-specific highlights, badge, and no teacher form-teacher card', async () => {
    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'ngozi.bello@gmail.com',
      isExistingUser: false,
      role: 'parent',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      inviterRole: 'Teacher — Greenfield College',
      token: 'parent-valid-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // Role badge
      expect(screen.getAllByText(/parent invitation/i).length).toBeGreaterThan(0);

      // Parent highlights from ROLE_META.parent
      expect(screen.getByText("Track your child's attendance")).toBeInTheDocument();
      expect(screen.getByText('View results and report cards')).toBeInTheDocument();
      expect(screen.getByText('Get school announcements')).toBeInTheDocument();

      // Teacher-specific highlights must NOT be present
      expect(screen.queryByText('Record daily attendance')).not.toBeInTheDocument();
      expect(screen.queryByText('Form Teacher')).not.toBeInTheDocument();

      // Details metadata
      expect(screen.getByText('ngozi.bello@gmail.com')).toBeInTheDocument();
      expect(screen.getAllByText('Mr. Emeka Balogun').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    });
  });

  it('navigates to setup form with locked email and parent note field ("Relationship to student")', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'ngozi.bello@gmail.com',
      isExistingUser: false,
      role: 'parent',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'parent-valid-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    // Setup form
    await waitFor(() => {
      expect(screen.getByText('Set up your account')).toBeInTheDocument();
    });

    // Locked email
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveValue('ngozi.bello@gmail.com');
    expect(emailInput).toHaveAttribute('readonly');
    expect(screen.getByText('Locked')).toBeInTheDocument();

    // Verify parent-specific optional note field
    const optionalToggle = screen.getByRole('button', { name: /profile details/i });
    await user.click(optionalToggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/relationship to student/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/father · primary contact/i)).toBeInTheDocument();
      // Must NOT show teacher "Qualifications"
      expect(screen.queryByLabelText(/qualifications/i)).not.toBeInTheDocument();
    });
  });

  it('submits parent credentials, establishes the parent role in auth store, and redirects to dashboard', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'ngozi.bello@gmail.com',
      isExistingUser: false,
      role: 'parent',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'parent-valid-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
      schoolId: 'school-123',
    });

    const mockRegister = vi.spyOn(invitationsApi, 'acceptNewUserInvitation').mockResolvedValue({
      user: {
        id: 'user-parent-1',
        email: 'ngozi.bello@gmail.com',
        fullName: 'Ngozi Bello',
        phone: '+2348021234567',
      },
      role: 'parent',
      schoolId: 'school-123',
      accessToken: 'jwt-access-parent-token',
      refreshToken: 'jwt-refresh-parent-token',
    });

    renderWithProviders(<AcceptInviteView initialStep="setup" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/first name/i), 'Ngozi');
    await user.type(screen.getByLabelText(/last name/i), 'Bello');
    await user.type(screen.getByLabelText(/phone number/i), '+2348021234567');
    await user.type(screen.getByLabelText(/^password/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'parent-valid-token',
          fullName: 'Ngozi Bello',
          password: 'StrongP@ss1',
        })
      );
    });

    // Check that role was established as 'parent' (NOT teacher or admin)
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.role).toBe('parent');
      expect(state.user?.role).toBe('parent');
      expect(state.user?.email).toBe('ngozi.bello@gmail.com');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles existing parent user accepting invitation via login', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('token=parent-existing-token'));
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'tunde.bakare@gmail.com',
      isExistingUser: true,
      role: 'parent',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'parent-existing-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
      schoolId: 'school-123',
    });

    vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      user: {
        id: 'parent-user-existing',
        email: 'tunde.bakare@gmail.com',
        fullName: 'Tunde Bakare',
        role: 'parent',
        schoolId: 'school-123',
      },
      token: 'access-token-existing',
    } as any);

    const mockAcceptExisting = vi.spyOn(invitationsApi, 'acceptExistingUserInvitation').mockResolvedValue({
      success: true,
      role: 'parent',
      schoolId: 'school-123',
    });

    renderWithProviders(<AcceptInviteView initialStep="login" />);

    await waitFor(() => {
      expect(screen.getByText('Sign in to accept')).toBeInTheDocument();
      expect(screen.getByText('tunde.bakare@gmail.com')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^password/i), 'CorrectP@ss1');
    const submitBtn = screen.getByRole('button', { name: /sign in and accept/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockAcceptExisting).toHaveBeenCalledWith({
        token: 'parent-existing-token',
      });
    });

    // Role in auth store is parent
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.role).toBe('parent');
    });
  });
});

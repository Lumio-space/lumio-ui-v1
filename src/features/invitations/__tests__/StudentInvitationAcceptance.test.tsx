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

describe('Student Invitation Acceptance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams('token=student-valid-token'));
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      role: 'admin',
    });
  });

  it('renders Student invitation details landing with student-specific highlights, badge, and no teacher form-teacher card', async () => {
    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'daniel.adeyemi@greenfieldcollege.ng',
      isExistingUser: false,
      role: 'student',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      inviterRole: 'Teacher — Greenfield College',
      token: 'student-valid-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // Role badge
      expect(screen.getAllByText(/student invitation/i).length).toBeGreaterThan(0);

      // Student highlights from ROLE_META.student
      expect(screen.getByText('See your timetable')).toBeInTheDocument();
      expect(screen.getByText('Check your results')).toBeInTheDocument();
      expect(screen.getByText('Read school announcements')).toBeInTheDocument();

      // Teacher-specific highlights must NOT be present
      expect(screen.queryByText('Record daily attendance')).not.toBeInTheDocument();
      expect(screen.queryByText('Form Teacher')).not.toBeInTheDocument();

      // Details metadata
      expect(screen.getByText('daniel.adeyemi@greenfieldcollege.ng')).toBeInTheDocument();
      expect(screen.getAllByText('Mr. Emeka Balogun').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    });
  });

  it('navigates to setup form with locked email and student note field ("About you")', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'daniel.adeyemi@greenfieldcollege.ng',
      isExistingUser: false,
      role: 'student',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'student-valid-token',
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
    expect(emailInput).toHaveValue('daniel.adeyemi@greenfieldcollege.ng');
    expect(emailInput).toHaveAttribute('readonly');
    expect(screen.getByText('Locked')).toBeInTheDocument();

    // Verify student-specific optional note field
    const optionalToggle = screen.getByRole('button', { name: /profile details/i });
    await user.click(optionalToggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/about you/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/a short introduction/i)).toBeInTheDocument();
      // Must NOT show teacher "Qualifications" or parent "Relationship to student"
      expect(screen.queryByLabelText(/qualifications/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/relationship to student/i)).not.toBeInTheDocument();
    });
  });

  it('submits student credentials, establishes the student role in auth store, and redirects to dashboard', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'daniel.adeyemi@greenfieldcollege.ng',
      isExistingUser: false,
      role: 'student',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'student-valid-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
      schoolId: 'school-123',
    });

    const mockRegister = vi.spyOn(invitationsApi, 'acceptNewUserInvitation').mockResolvedValue({
      user: {
        id: 'user-student-1',
        email: 'daniel.adeyemi@greenfieldcollege.ng',
        fullName: 'Daniel Adeyemi',
        phone: '+2348021234567',
      },
      role: 'student',
      schoolId: 'school-123',
      accessToken: 'jwt-access-student-token',
      refreshToken: 'jwt-refresh-student-token',
    });

    renderWithProviders(<AcceptInviteView initialStep="setup" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/first name/i), 'Daniel');
    await user.type(screen.getByLabelText(/last name/i), 'Adeyemi');
    await user.type(screen.getByLabelText(/phone number/i), '+2348021234567');
    await user.type(screen.getByLabelText(/^password/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'student-valid-token',
          fullName: 'Daniel Adeyemi',
          password: 'StrongP@ss1',
        })
      );
    });

    // Check that role was established as 'student' (NOT teacher or admin)
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.role).toBe('student');
      expect(state.user?.role).toBe('student');
      expect(state.user?.email).toBe('daniel.adeyemi@greenfieldcollege.ng');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles existing student user accepting invitation via login', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('token=student-existing-token'));
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'validateInvitationToken').mockResolvedValue({
      email: 'zainab.yusuf@lumio.africa',
      isExistingUser: true,
      role: 'student',
      schoolName: 'Greenfield College',
      inviterName: 'Mr. Emeka Balogun',
      token: 'student-existing-token',
      expiresAt: '2026-10-05T00:00:00.000Z',
      schoolId: 'school-123',
    });

    vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      user: {
        id: 'student-user-existing',
        email: 'zainab.yusuf@lumio.africa',
        fullName: 'Zainab Yusuf',
        role: 'student',
        schoolId: 'school-123',
      },
      token: 'access-token-existing',
    } as any);

    const mockAcceptExisting = vi.spyOn(invitationsApi, 'acceptExistingUserInvitation').mockResolvedValue({
      success: true,
      role: 'student',
      schoolId: 'school-123',
    });

    renderWithProviders(<AcceptInviteView initialStep="login" />);

    await waitFor(() => {
      expect(screen.getByText('Sign in to accept')).toBeInTheDocument();
      expect(screen.getByText('zainab.yusuf@lumio.africa')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^password/i), 'CorrectP@ss1');
    const submitBtn = screen.getByRole('button', { name: /sign in and accept/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockAcceptExisting).toHaveBeenCalledWith({
        token: 'student-existing-token',
      });
    });

    // Role in auth store is student
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.role).toBe('student');
    });
  });
});

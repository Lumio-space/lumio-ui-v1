import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { AcceptInviteView } from '../components/AcceptInviteView';
import * as teachersApi from '../api/teachers.api';
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

describe('AcceptInviteView (lumio-react flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token-123'));
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      role: 'admin',
    });
  });

  it('renders missing token outcome when no token is present in URL', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));

    renderWithProviders(<AcceptInviteView />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing Invitation Link')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('renders invalid invitation outcome when token verification fails', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockRejectedValue(
      new Error('Invalid or expired invitation token')
    );

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText("This invitation link isn't valid")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  it('renders dedicated expired outcome when error indicates expiration', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockRejectedValue(
      new Error('Invitation token has expired')
    );

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('This invitation has expired')).toBeInTheDocument();
      expect(screen.getByText(/nothing is wrong with your account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact school administrator/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  it('renders already-used outcome when token was previously consumed', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockRejectedValue(
      new Error('This invitation has already been accepted')
    );

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('This invitation has already been used')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in to lumio/i })).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  it('renders network error state with retry button on connection failure', async () => {
    const mockRefetch = vi
      .spyOn(teachersApi, 'validateInvitationToken')
      .mockRejectedValueOnce(new Error('Network Error: Failed to connect'))
      .mockResolvedValueOnce({
        email: 'teacher@school.edu',
        isExistingUser: false,
        role: 'teacher',
        schoolName: 'Greenfield College',
        token: 'valid-token-123',
        expiresAt: '2099-10-01T00:00:00.000Z',
      });

    const user = userEvent.setup();
    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to verify invitation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry verification/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry verification/i }));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/you['’]ve been invited to join greenfield college/i)).toBeInTheDocument();
    });
  });

  it('renders Invitation Details View with InviteLayout brand panel, role badge, highlights, and details metadata', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // Brand panel elements
      expect(screen.getByText(/you['’]re invited to join greenfield college\./i)).toBeInTheDocument();
      expect(screen.getByText(/secure invitation · lumio for schools/i)).toBeInTheDocument();

      // Invitation Details view elements - clean greeting without deriving name from email
      expect(screen.getByText(/you['’]ve been invited to join greenfield college/i)).toBeInTheDocument();
      expect(screen.getByText('Record daily attendance')).toBeInTheDocument();
      expect(screen.getByText('Enter and publish results')).toBeInTheDocument();
      expect(screen.getByText('Reach parents directly')).toBeInTheDocument();

      // Details metadata dl
      expect(screen.getByText('mrs.smith@lumio.edu')).toBeInTheDocument();
      expect(screen.getAllByText('Teacher').length).toBeGreaterThan(0);

      // Buttons
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    });
  });

  it('displays assigned class alongside class department for senior secondary invitations as contextual class info', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
      classId: 'cls-sss2',
    });

    const classesApi = await import('@/features/classes/api/classes.api');
    vi.spyOn(classesApi, 'fetchClasses').mockResolvedValue([
      {
        id: 'cls-sss2',
        schoolId: 'school-1',
        grade: 'SSS 2',
        section: 'B',
        level: 'senior_secondary',
        department: 'Arts',
        capacity: 30,
        room: 202,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByText('Form Teacher · SSS 2 Arts B')).toBeInTheDocument();
      expect(screen.getAllByText('Arts').length).toBeGreaterThan(0);
    });
  });

  it('renders broad panel with school name, location, and inviter administrator from backend data', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Kings College Lagos',
      schoolLocation: 'Victoria Island, Lagos, Nigeria',
      inviterName: 'Dr. Michael Adeyemi',
      inviterRole: 'School Administrator',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // School identity
      expect(screen.getAllByText('Kings College Lagos').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Victoria Island, Lagos, Nigeria').length).toBeGreaterThan(0);

      // Inviter administrator
      expect(screen.getAllByText('Dr. Michael Adeyemi').length).toBeGreaterThan(0);
      expect(screen.getAllByText('School Administrator').length).toBeGreaterThan(0);
    });
  });

  it('handles decline modal confirmation, calls decline API, and switches to declined outcome', async () => {
    const user = userEvent.setup();

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    const mockDecline = vi.spyOn(teachersApi, 'declineInvitation').mockResolvedValue({
      success: true,
      message: 'Invitation declined successfully',
      status: 'revoked',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^decline$/i })).toBeInTheDocument();
    });

    // Click Decline button to open modal
    await user.click(screen.getByRole('button', { name: /^decline$/i }));

    // Modal is opened
    await waitFor(() => {
      expect(screen.getByText('Decline this invitation?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep invitation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline invitation/i })).toBeInTheDocument();
    });

    // Confirm decline
    await user.click(screen.getByRole('button', { name: /decline invitation/i }));

    // Verify decline API was called
    expect(mockDecline).toHaveBeenCalledWith({ token: 'valid-token-123' });

    // Declined outcome card is shown
    await waitFor(() => {
      expect(screen.getByText('Invitation declined')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change my mind/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
        'href',
        '/login'
      );
    });

    // Clicking "Change my mind" restores the details view
    await user.click(screen.getByRole('button', { name: /change my mind/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });
  });

  it('transitions to setup view on accept, renders required fields, strictly excludes class/grade/age, and submits to dashboard', async () => {
    const user = userEvent.setup();

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    const mockRegister = vi
      .spyOn(teachersApi, 'acceptNewUserInvitation')
      .mockResolvedValue({
        user: {
          id: 'user-new-123',
          email: 'mrs.smith@lumio.edu',
          fullName: 'Jane Smith',
        },
        role: 'teacher',
        schoolId: 'sch-123',
        classId: 'cls-sss2',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });

    // Click Accept invitation to transition to Step 2: Setup form
    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    await waitFor(() => {
      expect(screen.getByText('Set up your account')).toBeInTheDocument();
      expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    // Email is read-only and locked
    const emailInput = screen.getByDisplayValue('mrs.smith@lumio.edu');
    expect(emailInput).toBeDisabled();

    // Class, Grade, Section, Form Class, and Age must NOT be in required form
    expect(screen.queryByLabelText(/form class/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^class$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/grade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/section/i)).not.toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/phone number/i), '+2348012345678');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        token: 'valid-token-123',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        phone: '+2348012345678',
        password: 'Password123!',
      });
      expect(useAuthStore.getState().role).toBe('teacher');
      expect(useAuthStore.getState().user?.classId).toBe('cls-sss2');
    });

    // Check for InviteSuccess confirmation screen
    await waitFor(() => {
      expect(screen.getByText(/welcome to lumio, jane!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to lumio/i })).toBeInTheDocument();
    });

    // Clicking "Continue to Lumio" navigates to dashboard
    await user.click(screen.getByRole('button', { name: /continue to lumio/i }));
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles existing user acceptance when user is already signed in with matching email', async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: {
        name: 'Jane Existing',
        email: 'jane.existing@lumio.edu',
        role: 'TEACHER',
      },
      isAuthenticated: true,
      role: 'admin',
    });

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'jane.existing@lumio.edu',
      isExistingUser: true,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    const mockAcceptExisting = vi
      .spyOn(teachersApi, 'acceptExistingUserInvitation')
      .mockResolvedValue({
        success: true,
        role: 'teacher',
        schoolId: 'sch-existing',
        classId: 'cls-assigned-456',
      });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in to accept/i })).toBeInTheDocument();
    });

    // Click Sign in to accept to transition to existing user view
    await user.click(screen.getByRole('button', { name: /sign in to accept/i }));

    await waitFor(() => {
      expect(screen.getByText(/you are signed in as/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /accept invitation & continue/i })
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /accept invitation & continue/i })
    );

    await waitFor(() => {
      expect(mockAcceptExisting).toHaveBeenCalledWith({
        token: 'valid-token-123',
      });
      expect(useAuthStore.getState().role).toBe('teacher');
      expect(useAuthStore.getState().user?.classId).toBe('cls-assigned-456');
    });

    // Check for InviteSuccess confirmation screen
    await waitFor(() => {
      expect(screen.getByText(/you['’]ve joined greenfield college/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to lumio/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /continue to lumio/i }));
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows account mismatch warning when signed in as different email', async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: {
        name: 'Other User',
        email: 'other@lumio.edu',
        role: 'SCHOOL_ADMIN',
      },
      isAuthenticated: true,
    });

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'invited@lumio.edu',
      isExistingUser: true,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in to accept/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sign in to accept/i }));

    await waitFor(() => {
      expect(screen.getByText(/other@lumio.edu/i)).toBeInTheDocument();
      expect(screen.getAllByText(/invited@lumio.edu/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /switch account/i })).toBeInTheDocument();
    });
  });

  it('handles existing user inline sign in and acceptance when unauthenticated', async () => {
    const user = userEvent.setup();

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'jane.existing@lumio.edu',
      isExistingUser: true,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    const mockLogin = vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      token: 'token-123',
      user: {
        id: 'u-1',
        email: 'jane.existing@lumio.edu',
        name: 'Jane Existing',
        role: 'TEACHER',
      },
      memberships: [],
    });

    const mockAcceptExisting = vi
      .spyOn(teachersApi, 'acceptExistingUserInvitation')
      .mockResolvedValue({
        success: true,
        role: 'teacher',
        schoolId: 'sch-existing',
      });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in to accept/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sign in to accept/i }));

    await waitFor(() => {
      expect(screen.getByText('Sign in to accept')).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^password$/i), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /sign in and accept/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'jane.existing@lumio.edu',
        password: 'Secret123!',
        rememberMe: true,
      });
      expect(mockAcceptExisting).toHaveBeenCalledWith({
        token: 'valid-token-123',
      });
      expect(useAuthStore.getState().role).toBe('teacher');
    });

    await waitFor(() => {
      expect(screen.getByText(/you['’]ve joined greenfield college/i)).toBeInTheDocument();
    });
  });

  it('renders recipient name in greeting when inviteeName is provided, never extracting from email', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'loyalboyfriendd@example.com',
      inviteeName: 'Babatunde Adebayo',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'St. Gregory College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      // Must greet with actual inviteeName
      expect(
        screen.getByText(/hi babatunde adebayo, you[’']ve been invited to st\. gregory college/i)
      ).toBeInTheDocument();
      // Must NEVER contain loyalboyfriendd extracted from email
      expect(screen.queryByText(/loyalboyfriendd/i, { selector: 'h1' })).not.toBeInTheDocument();
      // Dynamic initials for St. Gregory College should be SG, not GC
      expect(screen.getByText('SG')).toBeInTheDocument();
    });
  });

  it('renders inviter greeting when only inviterName is provided and never derives name from email', async () => {
    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'loyalboyfriendd@example.com',
      inviterName: 'Principal Danjuma',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Apex Academy',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(
        screen.getByText(/you[’']ve been invited by principal danjuma to join apex academy/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/loyalboyfriendd/i, { selector: 'h1' })).not.toBeInTheDocument();
      expect(screen.getByText('AA')).toBeInTheDocument();
    });
  });

  it('operates entirely in memory and never accesses localStorage throughout the flow', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
      classId: 'cls-123',
    });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('allows registration without a phone number per backend contract', async () => {
    const user = userEvent.setup();

    vi.spyOn(teachersApi, 'validateInvitationToken').mockResolvedValue({
      email: 'mrs.smith@lumio.edu',
      isExistingUser: false,
      role: 'teacher',
      schoolName: 'Greenfield College',
      token: 'valid-token-123',
      expiresAt: '2099-10-01T00:00:00.000Z',
    });

    const mockRegister = vi
      .spyOn(teachersApi, 'acceptNewUserInvitation')
      .mockResolvedValue({
        user: {
          id: 'user-new-123',
          email: 'mrs.smith@lumio.edu',
          fullName: 'Jane Smith',
        },
        role: 'teacher',
        schoolId: 'sch-123',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

    renderWithProviders(<AcceptInviteView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    await waitFor(() => {
      expect(screen.getByText('Set up your account')).toBeInTheDocument();
    });

    // Fill form without phone
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        token: 'valid-token-123',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        password: 'Password123!',
      });
    });
  });
});


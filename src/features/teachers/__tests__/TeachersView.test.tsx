import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { TeachersView } from '../components/TeachersView';

const {
  mockUseTeachers,
  mockUseClasses,
  mockUseInvitations,
  mockInviteMutateAsync,
  mockRemoveMutate,
  mockUpdateStatusMutate,
} = vi.hoisted(() => ({
  mockUseTeachers: vi.fn(),
  mockUseClasses: vi.fn(),
  mockUseInvitations: vi.fn(),
  mockInviteMutateAsync: vi.fn(),
  mockRemoveMutate: vi.fn(),
  mockUpdateStatusMutate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useTeachers: () => mockUseTeachers(),
  useClasses: () => mockUseClasses(),
  useInvitations: () => mockUseInvitations(),
  useInviteTeacher: () => ({
    mutateAsync: mockInviteMutateAsync,
    isPending: false,
  }),
  useRemoveTeacher: () => ({
    mutate: mockRemoveMutate,
    isPending: false,
  }),
  useUpdateTeacherStatus: () => ({
    mutate: mockUpdateStatusMutate,
    isPending: false,
  }),
  useAssignFormTeacher: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAssignTeacherSubject: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

const MOCK_CLASSES = [
  {
    id: 'cls-1',
    schoolId: 'school-1',
    grade: 'Primary 1',
    section: 'A',
    level: 'primary',
    capacity: 35,
    room: 101,
    formTeacher: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    subjects: ['Mathematics'],
  },
];

const MOCK_TEACHERS = [
  {
    id: 'mem-1',
    userId: 'user-1',
    schoolId: 'school-1',
    role: 'teacher',
    status: 'active',
    joinedAt: '2026-01-01T00:00:00.000Z',
    fullName: 'Dr. Evelyn Hughes',
    department: 'Sciences',
    rating: 4.9,
    subjects: [{ id: 'sub-1', title: 'Mathematics' }],
  },
];

const MOCK_INVITATIONS = [
  {
    id: 'inv-1',
    name: 'Naomi Adeyemi',
    email: 'naomi.adeyemi@lumio.edu',
    classId: 'cls-1',
    className: 'Primary 1 A',
    subjects: ['Mathematics'],
    status: 'Pending' as const,
    sent: '2026-06-27T00:00:00.000Z',
    expires: '2026-07-04T00:00:00.000Z',
    token: 'test-token-123',
  },
];

let mockWriteText = vi.fn();

describe('TeachersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeachers.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseClasses.mockReturnValue({
      data: MOCK_CLASSES,
      isLoading: false,
    });
    mockUseInvitations.mockReturnValue({
      invitations: [],
      addInvitation: vi.fn(),
      resendInvitation: vi.fn(),
      revokeInvitation: vi.fn(),
      syncWithBackend: vi.fn(),
    });
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders page header and main tabs', () => {
    renderWithProviders(<TeachersView />);

    expect(screen.getByRole('heading', { name: /^teachers$/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /invite teacher/i })[0]).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /teachers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /invitations/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /class assignments/i })).toBeInTheDocument();
  });

  it('renders empty state when no teachers exist', () => {
    renderWithProviders(<TeachersView />);

    expect(screen.getByText('No teachers found')).toBeInTheDocument();
    expect(screen.getByText(/invite teachers to build your faculty/i)).toBeInTheDocument();
  });

  it('renders teachers when available', () => {
    mockUseTeachers.mockReturnValue({
      data: MOCK_TEACHERS,
      isLoading: false,
    });

    renderWithProviders(<TeachersView />);

    expect(screen.getByText('Dr. Evelyn Hughes')).toBeInTheDocument();
    expect(screen.getAllByText(/sciences/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to invitations tab and displays invitations table without copy link', async () => {
    const user = userEvent.setup();
    mockUseInvitations.mockReturnValue({
      invitations: MOCK_INVITATIONS,
      addInvitation: vi.fn(),
      resendInvitation: vi.fn(),
      revokeInvitation: vi.fn(),
    });

    renderWithProviders(<TeachersView />);

    const invitesTab = screen.getByRole('tab', { name: /invitations/i });
    await user.click(invitesTab);

    expect(screen.getByText('Naomi Adeyemi')).toBeInTheDocument();
    expect(screen.getByText('naomi.adeyemi@lumio.edu')).toBeInTheDocument();
    expect(screen.getByText('Primary 1 A')).toBeInTheDocument();

    // Verify copy link button is removed and resend button is present
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
  });

  it('switches to class assignments tab and shows unassigned class with Assign button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeachersView />);

    const assignmentsTab = screen.getByRole('tab', { name: /class assignments/i });
    await user.click(assignmentsTab);

    expect(screen.getByText('Primary 1 A')).toBeInTheDocument();
    expect(screen.getByText('No form teacher assigned')).toBeInTheDocument();

    const assignBtn = screen.getByRole('button', { name: /^assign$/i });
    await user.click(assignBtn);

    // Should open the assign form teacher modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /assign form teacher/i })).toBeInTheDocument();
    });
  });

  it('opens cancel confirmation modal when revoking an invitation', async () => {
    const user = userEvent.setup();
    const mockRevoke = vi.fn();
    mockUseInvitations.mockReturnValue({
      invitations: MOCK_INVITATIONS,
      addInvitation: vi.fn(),
      resendInvitation: vi.fn(),
      revokeInvitation: mockRevoke,
    });

    renderWithProviders(<TeachersView />);

    const invitesTab = screen.getByRole('tab', { name: /invitations/i });
    await user.click(invitesTab);

    const revokeBtn = screen.getByRole('button', { name: /revoke invitation/i });
    await user.click(revokeBtn);

    // Confirmation modal appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /cancel invitation\?/i })).toBeInTheDocument();
    });

    // Clicking confirm cancels the invitation
    const confirmBtn = screen.getByRole('button', { name: /^cancel invitation$/i });
    await user.click(confirmBtn);

    expect(mockRevoke).toHaveBeenCalledWith('inv-1');
  });


  it('opens wizard when header "Invite teacher" button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeachersView />);

    const headerInviteBtn = screen.getAllByRole('button', { name: /invite teacher/i })[0];
    await user.click(headerInviteBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Invite a teacher')).toBeInTheDocument();
    });
  });

  it('renders teachers when data is wrapped in { data: [...] }', () => {
    mockUseTeachers.mockReturnValue({
      data: { data: MOCK_TEACHERS },
      isLoading: false,
    });

    renderWithProviders(<TeachersView />);
    expect(screen.getByText('Dr. Evelyn Hughes')).toBeInTheDocument();
  });

  it('renders teachers when data is wrapped in { teachers: [...] }', () => {
    mockUseTeachers.mockReturnValue({
      data: { teachers: MOCK_TEACHERS },
      isLoading: false,
    });

    renderWithProviders(<TeachersView />);
    expect(screen.getByText('Dr. Evelyn Hughes')).toBeInTheDocument();
  });

  it('handles non-array empty object gracefully without crashing', () => {
    mockUseTeachers.mockReturnValue({
      data: {},
      isLoading: false,
    });

    expect(() => renderWithProviders(<TeachersView />)).not.toThrow();
  });

  it('displays department for senior secondary classes in class assignments tab', async () => {
    mockUseClasses.mockReturnValue({
      data: [
        {
          id: 'cls-sss1',
          schoolId: 'school-1',
          grade: 'SSS 1',
          section: 'A',
          level: 'senior_secondary',
          department: 'Science',
          capacity: 35,
          room: 301,
          formTeacher: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          subjects: ['Physics'],
        },
      ],
      isLoading: false,
    });

    const user = userEvent.setup();
    renderWithProviders(<TeachersView />);

    const assignmentsTab = screen.getByRole('tab', { name: /class assignments/i });
    await user.click(assignmentsTab);

    expect(screen.getByText('SSS 1 Science A')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { InviteTeacherModal } from '../components/InviteTeacherModal';

const { mockUseClasses, mockMutateAsync } = vi.hoisted(() => ({
  mockUseClasses: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

vi.mock('../hooks', () => ({
  useInviteTeacher: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
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
    subjects: ['Mathematics', 'English'],
  },
  {
    id: 'cls-2',
    schoolId: 'school-1',
    grade: 'JSS 2',
    section: 'B',
    level: 'junior_secondary',
    capacity: 30,
    room: 205,
    formTeacher: 'teacher-existing-uuid',
    createdAt: '2026-01-02T00:00:00.000Z',
    subjects: ['Basic Science'],
  },
  {
    id: 'cls-3',
    schoolId: 'school-1',
    grade: 'SSS 1',
    section: 'A',
    level: 'senior_secondary',
    department: 'Science',
    capacity: 30,
    room: 301,
    formTeacher: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    subjects: ['Physics', 'Chemistry'],
  },
];

let mockWriteText = vi.fn();

describe('InviteTeacherModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    invitations: [],
    onInvitationCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClasses.mockReturnValue({
      data: MOCK_CLASSES,
      isLoading: false,
    });
    mockMutateAsync.mockResolvedValue({
      id: 'inv-uuid-123',
      email: 'john.okafor@lumio.edu',
      role: 'teacher',
      classId: 'cls-1',
      status: 'pending',
      token: 'test-token-abc-123',
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

  it('renders modal with title "Invite a teacher" and step 1 "Select class"', () => {
    renderWithProviders(<InviteTeacherModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Invite a teacher')).toBeInTheDocument();
    expect(screen.getByText('Select class')).toBeInTheDocument();
    expect(screen.getByText('Primary 1 A')).toBeInTheDocument();
    expect(screen.getByText('JSS 2 B')).toBeInTheDocument();
  });

  it('disables classes that already have a form teacher assigned', () => {
    renderWithProviders(<InviteTeacherModal {...defaultProps} />);

    expect(screen.getByText('Form Teacher assigned')).toBeInTheDocument();
    const assignedClassButton = screen.getByText('JSS 2 B').closest('button');
    expect(assignedClassButton).toBeDisabled();
  });

  it('completes the 2-step wizard flow and sends invitation without subjects', async () => {
    const user = userEvent.setup();
    const onInvitationCreated = vi.fn();

    renderWithProviders(
      <InviteTeacherModal
        {...defaultProps}
        onInvitationCreated={onInvitationCreated}
      />
    );

    // Step 1: Select class Primary 1 A
    const unassignedButton = screen.getByText('Primary 1 A').closest('button')!;
    await user.click(unassignedButton);

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    await user.click(continueBtn);

    // Step 2: Teacher details (email only)
    await waitFor(() => {
      expect(screen.getByText('Teacher details')).toBeInTheDocument();
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'john.okafor@lumio.edu');

    // Click "Send invitation" directly from Step 2
    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    // Verify backend mutation payload
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'john.okafor@lumio.edu',
        classId: 'cls-1',
      });
    });

    // Verify callback was called
    expect(onInvitationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john.okafor@lumio.edu',
        classId: 'cls-1',
        className: 'Primary 1 A',
        status: 'Pending',
      })
    );

    // Verify Success State without copy link
    await waitFor(() => {
      expect(screen.getByText('Invitation Sent!')).toBeInTheDocument();
      expect(screen.getByText(/an invitation email was sent to/i)).toBeInTheDocument();
      expect(screen.getByText('john.okafor@lumio.edu')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });

  it('validates required email field on step 2', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InviteTeacherModal {...defaultProps} />);

    // Select class
    await user.click(screen.getByText('Primary 1 A').closest('button')!);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 without filling email
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/email address is required/i);
  });

  it('displays class department alongside the class in step 1, step 2, and success view without submitting department', async () => {
    const user = userEvent.setup();
    const onInvitationCreated = vi.fn();

    renderWithProviders(
      <InviteTeacherModal
        {...defaultProps}
        onInvitationCreated={onInvitationCreated}
      />
    );

    // Step 1: verify Senior Secondary class shows class name WITH department badge alongside
    expect(screen.getByText('SSS 1 Science A')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();

    // Select the Senior Secondary class
    const sssClassButton = screen.getByText('SSS 1 Science A').closest('button')!;
    await user.click(sssClassButton);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: verify header displays class name and department badge alongside
    await waitFor(() => {
      expect(screen.getByText(/inviting a form teacher for/i)).toBeInTheDocument();
      expect(screen.getByText('SSS 1 Science A')).toBeInTheDocument();
      expect(screen.getAllByText('Science').length).toBeGreaterThan(0);
    });

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'science.teacher@lumio.edu');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    // Verify backend mutation payload has strictly email and classId (never department)
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'science.teacher@lumio.edu',
        classId: 'cls-3',
      });
    });

    // Verify success view displays class name with department
    await waitFor(() => {
      expect(screen.getByText('Invitation Sent!')).toBeInTheDocument();
      expect(screen.getByText(/SSS 1 Science A/i)).toBeInTheDocument();
    });

    expect(onInvitationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'SSS 1 Science A',
        email: 'science.teacher@lumio.edu',
        classId: 'cls-3',
      })
    );
  });
});

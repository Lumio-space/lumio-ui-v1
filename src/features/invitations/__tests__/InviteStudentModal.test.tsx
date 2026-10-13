import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { InviteStudentModal } from '../components/InviteStudentModal';
import * as invitationsApi from '../api/invitations.api';

const { mockUseClasses } = vi.hoisted(() => ({
  mockUseClasses: vi.fn(),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

const MOCK_CLASSES = [
  {
    id: 'c1234567-89ab-cdef-0123-456789abcdef',
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
    id: 'c2234567-89ab-cdef-0123-456789abcdef',
    schoolId: 'school-1',
    grade: 'JSS 2',
    section: 'B',
    level: 'junior_secondary',
    capacity: 30,
    room: 205,
    formTeacher: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    subjects: ['Basic Science'],
  },
];

describe('InviteStudentModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onInvitationCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClasses.mockReturnValue({
      data: MOCK_CLASSES,
      isLoading: false,
    });
  });

  it('renders modal with title "Invite a student", class select, and email field', () => {
    renderWithProviders(<InviteStudentModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Invite a student')).toBeInTheDocument();
    expect(screen.getByLabelText(/class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Verify absence of personal profile fields during invitation creation
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/admission number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/gender/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it('validates that both class selection and student email are required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InviteStudentModal {...defaultProps} />);

    // Click send without choosing class or email
    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/please select a class for the student/i);

    // Select class
    const classSelect = screen.getByLabelText(/class/i);
    await user.selectOptions(classSelect, 'c1234567-89ab-cdef-0123-456789abcdef');

    // Click send with class selected but email empty
    await user.click(sendBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/student email address is required/i);

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(sendBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
  });

  it('submits email and classId to POST /invites/students and triggers success callback', async () => {
    const user = userEvent.setup();
    const onInvitationCreated = vi.fn();

    const mockInvite = vi.spyOn(invitationsApi, 'inviteStudent').mockResolvedValue({
      id: 'inv-student-123',
      email: 'student@example.com',
      role: 'student',
      status: 'pending',
      classId: 'c1234567-89ab-cdef-0123-456789abcdef',
      token: 'student-token-xyz',
    });

    renderWithProviders(
      <InviteStudentModal
        {...defaultProps}
        onInvitationCreated={onInvitationCreated}
      />
    );

    const classSelect = screen.getByLabelText(/class/i);
    await user.selectOptions(classSelect, 'c1234567-89ab-cdef-0123-456789abcdef');

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'student@example.com');

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    await waitFor(() => {
      // Must call backend with email and classId per backend DTO
      expect(mockInvite).toHaveBeenCalledWith({
        email: 'student@example.com',
        classId: 'c1234567-89ab-cdef-0123-456789abcdef',
      });
    });

    expect(onInvitationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        role: 'student',
        status: 'Pending',
      })
    );

    // Success view
    await waitFor(() => {
      expect(screen.getByText('Invitation Sent!')).toBeInTheDocument();
      expect(screen.getByText(/an invitation email was sent to/i)).toBeInTheDocument();
      expect(screen.getByText('student@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });

  it('displays backend API error message clearly in the alert banner', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'inviteStudent').mockRejectedValue(
      new Error('student@example.com is already a member of this school')
    );

    renderWithProviders(<InviteStudentModal {...defaultProps} />);

    const classSelect = screen.getByLabelText(/class/i);
    await user.selectOptions(classSelect, 'c1234567-89ab-cdef-0123-456789abcdef');

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'student@example.com');

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'student@example.com is already a member of this school'
      );
    });
  });
});

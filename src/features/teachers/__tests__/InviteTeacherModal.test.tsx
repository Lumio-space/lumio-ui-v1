import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { InviteTeacherModal } from '../components/InviteTeacherModal';

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useInviteTeacher: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('InviteTeacherModal (Email-Only Workflow)', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onInvitationCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      id: 'inv-uuid-123',
      email: 'john.okafor@lumio.edu',
      role: 'teacher',
      status: 'pending',
      token: 'test-token-abc-123',
    });
  });

  it('renders modal with title "Invite a teacher" and strictly email input', () => {
    renderWithProviders(<InviteTeacherModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Invite a teacher')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Verify other fields are NOT rendered
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/department/i)).not.toBeInTheDocument();

    expect(
      screen.getByText(/class and subject assignments happen after the teacher accepts and joins the school/i)
    ).toBeInTheDocument();
  });

  it('disables submit button when email is empty or invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InviteTeacherModal {...defaultProps} />);

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    expect(sendBtn).toBeDisabled();

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    expect(sendBtn).toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, 'valid.teacher@lumio.edu');
    expect(sendBtn).toBeEnabled();
  });

  it('submits email-only invitation and triggers onInvitationCreated with success view', async () => {
    const user = userEvent.setup();
    const onInvitationCreated = vi.fn();

    renderWithProviders(
      <InviteTeacherModal
        {...defaultProps}
        onInvitationCreated={onInvitationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'john.okafor@lumio.edu');

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'john.okafor@lumio.edu',
        assignmentType: 'none',
      });
    });

    expect(onInvitationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john.okafor@lumio.edu',
        name: 'john.okafor@lumio.edu',
        role: 'teacher',
        status: 'Pending',
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Invitation Sent!')).toBeInTheDocument();
      expect(screen.getByText(/an invitation email was sent to/i)).toBeInTheDocument();
      expect(screen.getByText('john.okafor@lumio.edu')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });
});

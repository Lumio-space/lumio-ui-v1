import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { InviteParentModal } from '../components/InviteParentModal';
import * as invitationsApi from '../api/invitations.api';

describe('InviteParentModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onInvitationCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title "Invite a parent" and only email field', () => {
    renderWithProviders(<InviteParentModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Invite a parent')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Verify absence of profile fields during invitation creation
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/child/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/age/i)).not.toBeInTheDocument();
  });

  it('validates that parent email is required and formatted properly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InviteParentModal {...defaultProps} />);

    // Click send without entering email
    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/parent email address is required/i);

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(sendBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
  });

  it('submits only email to POST /invites/parents and triggers success callback', async () => {
    const user = userEvent.setup();
    const onInvitationCreated = vi.fn();

    const mockInvite = vi.spyOn(invitationsApi, 'inviteParent').mockResolvedValue({
      id: 'inv-parent-123',
      email: 'parent@example.com',
      role: 'parent',
      status: 'pending',
      token: 'parent-token-xyz',
    });

    renderWithProviders(
      <InviteParentModal
        {...defaultProps}
        onInvitationCreated={onInvitationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'parent@example.com');

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    await waitFor(() => {
      // Must call backend with email only
      expect(mockInvite).toHaveBeenCalledWith({
        email: 'parent@example.com',
      });
    });

    expect(onInvitationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'parent@example.com',
        role: 'parent',
        status: 'Pending',
      })
    );

    // Success view
    await waitFor(() => {
      expect(screen.getByText('Invitation Sent!')).toBeInTheDocument();
      expect(screen.getByText(/an invitation email was sent to/i)).toBeInTheDocument();
      expect(screen.getByText('parent@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });

  it('displays backend API error message clearly in the alert banner', async () => {
    const user = userEvent.setup();

    vi.spyOn(invitationsApi, 'inviteParent').mockRejectedValue(
      new Error('parent@example.com is already a member of this school')
    );

    renderWithProviders(<InviteParentModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'parent@example.com');

    const sendBtn = screen.getByRole('button', { name: /send invitation/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'parent@example.com is already a member of this school'
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { PendingInvitationModal } from '../components/PendingInvitationModal';
import type { PendingInvitation } from '@/features/auth/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}));

const mockAcceptMutate = vi.fn();
const mockDeclineMutate = vi.fn();

vi.mock('@/features/teachers/hooks/useAcceptInvitation', () => ({
  useAcceptExistingTeacher: () => ({
    mutate: mockAcceptMutate,
    isPending: false,
    error: null,
  }),
  useDeclineInvitation: () => ({
    mutate: mockDeclineMutate,
    isPending: false,
    error: null,
  }),
}));

describe('PendingInvitationModal', () => {
  const sampleInvite: PendingInvitation = {
    id: 'invite-123',
    schoolId: 'school-456',
    schoolName: 'Greenwood High',
    role: 'teacher',
    assignmentType: 'form_teacher',
    token: 'token-abc',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invitation details with school name, role and assignment', () => {
    renderWithProviders(
      <PendingInvitationModal
        open={true}
        invitation={sampleInvite}
      />
    );

    expect(screen.getByText('School Invitation')).toBeInTheDocument();
    expect(screen.getAllByText('Greenwood High').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/form teacher/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('triggers acceptExisting with invitationId and token when Accept is clicked', async () => {
    mockAcceptMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({
        success: true,
        schoolId: 'school-456',
        role: 'teacher',
      });
    });

    const onAccepted = vi.fn();
    renderWithProviders(
      <PendingInvitationModal
        open={true}
        invitation={sampleInvite}
        onAccepted={onAccepted}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));

    expect(mockAcceptMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invite-123',
        token: 'token-abc',
      }),
      expect.any(Object)
    );

    await waitFor(() => {
      expect(onAccepted).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows confirmation when Decline is clicked and calls decline API', async () => {
    mockDeclineMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({ success: true });
    });

    const onDeclined = vi.fn();
    renderWithProviders(
      <PendingInvitationModal
        open={true}
        invitation={sampleInvite}
        onDeclined={onDeclined}
      />
    );

    // Initial decline click asks for confirmation
    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(screen.getByText(/are you sure you want to decline this invitation\?/i)).toBeInTheDocument();

    // Confirm decline
    fireEvent.click(screen.getByRole('button', { name: /confirm decline/i }));

    expect(mockDeclineMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invite-123',
        token: 'token-abc',
      }),
      expect.any(Object)
    );

    await waitFor(() => {
      expect(onDeclined).toHaveBeenCalled();
      expect(screen.getByText(/invitation declined/i)).toBeInTheDocument();
    });
  });
});

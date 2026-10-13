import { describe, it, expect, beforeEach } from 'vitest';
import { useInvitationsStore } from '../invitations.store';
import type { TeacherRecord } from '@/features/teachers/types';
import type { ClassRecord } from '@/features/classes/types';

describe('useInvitationsStore - Invitation Lifecycle & Sync', () => {
  beforeEach(() => {
    useInvitationsStore.setState({ invitations: [] });
  });

  it('adds an invitation with Pending status and generates id and timestamps', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'jane.doe@school.edu',
      name: 'Jane Doe',
      classId: 'cls-101',
      className: 'Primary 1 A',
      role: 'teacher',
      status: 'Pending',
    });

    const invitations = useInvitationsStore.getState().invitations;
    expect(invitations).toHaveLength(1);
    expect(invitations[0].email).toBe('jane.doe@school.edu');
    expect(invitations[0].status).toBe('Pending');
    expect(invitations[0].id).toBeDefined();
    expect(invitations[0].sent).toBeDefined();
  });

  it('transitions Pending invitation to Accepted with acceptedAt timestamp on markAccepted', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'jane.doe@school.edu',
      classId: 'cls-101',
      className: 'Primary 1 A',
      status: 'Pending',
    });

    const invite = useInvitationsStore.getState().invitations[0];
    useInvitationsStore.getState().markAccepted(invite.id);

    const updated = useInvitationsStore.getState().invitations[0];
    expect(updated.status).toBe('Accepted');
    expect(updated.acceptedOn).toBeDefined();
  });

  it('marks invitation as Declined on markDeclined', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'jane.doe@school.edu',
      classId: 'cls-101',
      className: 'Primary 1 A',
      status: 'Pending',
    });

    const invite = useInvitationsStore.getState().invitations[0];
    useInvitationsStore.getState().markDeclined(invite.id);

    const updated = useInvitationsStore.getState().invitations[0];
    expect(updated.status).toBe('Declined');
  });

  it('updates timestamp and sets status back to Pending on resendInvitation', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'jane.doe@school.edu',
      classId: 'cls-101',
      className: 'Primary 1 A',
      status: 'Expired',
    });

    const invite = useInvitationsStore.getState().invitations[0];

    useInvitationsStore.getState().resendInvitation(invite.id);

    const updated = useInvitationsStore.getState().invitations[0];
    expect(updated.status).toBe('Pending');
    expect(new Date(updated.expires).getTime()).toBeGreaterThan(Date.now());
  });

  it('removes invitation on cancelInvitation', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'jane.doe@school.edu',
      classId: 'cls-101',
      className: 'Primary 1 A',
      status: 'Pending',
    });

    const invite = useInvitationsStore.getState().invitations[0];
    useInvitationsStore.getState().cancelInvitation(invite.id);

    expect(useInvitationsStore.getState().invitations).toHaveLength(0);
  });

  it('syncWithBackend automatically marks invitations as Accepted if teacher or class already exists', () => {
    useInvitationsStore.getState().addInvitation({
      email: 'registered.teacher@school.edu',
      classId: 'cls-101',
      className: 'Primary 1 A',
      status: 'Pending',
    });

    const backendTeachers: TeacherRecord[] = [
      {
        id: 't-1',
        userId: 'u-1',
        schoolId: 's-1',
        fullName: 'Registered Teacher',
        email: 'registered.teacher@school.edu',
        role: 'teacher',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        subjects: [],
        classId: 'cls-101',
      },
    ];

    const backendClasses: ClassRecord[] = [
      {
        id: 'cls-101',
        schoolId: 's-1',
        grade: 'Primary 1',
        section: 'A',
        level: 'primary',
        formTeacher: 't-1',
        capacity: 30,
        room: 101,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    useInvitationsStore.getState().syncWithBackend(backendTeachers, backendClasses);

    const updated = useInvitationsStore.getState().invitations[0];
    expect(updated.status).toBe('Accepted');
    expect(updated.name).toBe('Registered Teacher');
  });
});

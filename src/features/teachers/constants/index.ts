/**
 * Teachers Feature Constants
 *
 * Query keys, filter options, status tones, and helper functions migrated from lumio-react.
 */

import type { InviteStatus, TeacherInvitation } from '../types';

export const teacherQueryKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherQueryKeys.all, 'list'] as const,
  details: () => [...teacherQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherQueryKeys.details(), id] as const,
};

export const INVITE_FILTERS = ['All', 'Pending', 'Accepted', 'Declined', 'Expired'] as const;

export const inviteStatusTone: Record<InviteStatus, 'gold' | 'green' | 'slate' | 'red'> = {
  Pending: 'gold',
  Accepted: 'green',
  Declined: 'slate',
  Expired: 'red',
};

/** Human-readable assignment status used across teacher and class views */
export function assignmentLabel(status: InviteStatus): string {
  if (status === 'Accepted') return 'Active — Form Teacher';
  if (status === 'Pending') return 'Invitation Pending';
  if (status === 'Declined') return 'Invitation Declined';
  return 'Invitation Expired';
}

/** The form teacher (or pending invitee) for a given class */
export function formTeacherForClass(
  list: TeacherInvitation[],
  classId: string
): TeacherInvitation | null {
  const accepted = list.find((i) => i.classId === classId && i.status === 'Accepted');
  if (accepted) return accepted;
  const pending = list.find((i) => i.classId === classId && i.status === 'Pending');
  return pending ?? null;
}

/** The class a given teacher is form teacher of (or invited to lead) */
export function assignmentForTeacher(
  list: TeacherInvitation[],
  teacher: string | { name?: string; fullName?: string; email?: string; userId?: string; classId?: string | null }
): TeacherInvitation | null {
  if (!teacher) return null;
  const teacherObj = typeof teacher === 'string' ? { name: teacher } : teacher;
  const name = teacherObj.fullName || teacherObj.name;
  const email = teacherObj.email?.toLowerCase();
  const userId = teacherObj.userId;
  const classId = teacherObj.classId;

  // First search for accepted invitations matching by userId, classId, email, or name
  const accepted = list.find(
    (i) =>
      i.status === 'Accepted' &&
      ((userId && i.teacherId === userId) ||
       (classId && i.classId === classId) ||
       (email && i.email.toLowerCase() === email) ||
       (name && i.name?.toLowerCase() === name.toLowerCase()))
  );
  if (accepted) return accepted;

  // Otherwise search for pending invitations matching email, classId, or name
  return (
    list.find(
      (i) =>
        (classId && i.classId === classId) ||
        (email && i.email.toLowerCase() === email) ||
        (name && i.name?.toLowerCase() === name.toLowerCase())
    ) ?? null
  );
}

export const DEPARTMENTS = ['Sciences', 'Humanities', 'Technology', 'Arts'];

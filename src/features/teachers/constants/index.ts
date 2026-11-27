/**
 * Teachers Feature Constants
 *
 * Query keys, filter options, status tones, and helper functions migrated from lumio-react.
 */

import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  isActiveClass,
  sortClassesSerially,
} from '@/features/classes/constants';
import type {
  InviteStatus,
  TeacherInvitation,
  TeacherClassAssignment,
  TeacherSubject,
} from '../types';

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
  Revoked: 'red',
};

/** Human-readable assignment status used across teacher and class views */
export function assignmentLabel(status: InviteStatus): string {
  if (status === 'Accepted') return 'Active — Form Teacher';
  if (status === 'Pending') return 'Invitation Pending';
  if (status === 'Declined') return 'Invitation Declined';
  if (status === 'Revoked') return 'Invitation Revoked';
  return 'Invitation Expired';
}

/** The form teacher (or pending invitee) for a given class */
export function formTeacherForClass(
  list: TeacherInvitation[],
  classId: string,
  teachers?: any[]
): TeacherInvitation | null {
  // 1. Source of truth for active teachers: teacher.classes and its isFormTeacher property
  if (Array.isArray(teachers)) {
    const activeTeacher = teachers.find(
      (t) =>
        t &&
        Array.isArray(t.classes) &&
        t.classes.some(
          (c: any) => typeof c === 'object' && c !== null && c.id === classId && Boolean(c.isFormTeacher)
        )
    );
    if (activeTeacher) {
      const name = activeTeacher.fullName || activeTeacher.name;
      const email = activeTeacher.email?.toLowerCase();
      const userId = activeTeacher.userId || activeTeacher.teacherId || activeTeacher.id;
      return {
        id: `form-teacher-${classId}`,
        classId,
        className: '',
        status: 'Accepted',
        sent: '',
        expires: '',
        email: email ?? '',
        teacherId: userId,
        name,
      };
    }
  }

  // 2. Invitation store for accepted or pending invites
  if (Array.isArray(list)) {
    const accepted = list.find((i) => i.classId === classId && i.status === 'Accepted');
    if (accepted) return accepted;
    const pending = list.find((i) => i.classId === classId && i.status === 'Pending');
    return pending ?? null;
  }

  return null;
}

/** All form-teacher class assignments (or pending invite) for a given teacher */
export function assignmentsForTeacher(
  list: TeacherInvitation[],
  teacher: string | { name?: string; fullName?: string; email?: string; userId?: string; classId?: string | null; classes?: Array<string | TeacherClassAssignment> }
): TeacherInvitation[] {
  if (!teacher) return [];
  const teacherObj = typeof teacher === 'string' ? { name: teacher } : teacher;
  const name = teacherObj.fullName || teacherObj.name;
  const email = teacherObj.email?.toLowerCase();
  const userId = teacherObj.userId || (teacherObj as any).teacherId || (teacherObj as any).id;
  const classId = teacherObj.classId;

  // 1. Source of truth for active teachers: teacher.classes and its isFormTeacher property
  const classesList = teacherObj.classes;
  if (Array.isArray(classesList)) {
    const uniqueFormClasses = Array.from(
      new Map(
        classesList
          .filter(
            (c): c is TeacherClassAssignment =>
              typeof c === 'object' &&
              c !== null &&
              Boolean(c.isFormTeacher) &&
              isActiveClass(c as { deletedAt?: string | null })
          )
          .map((c) => [c.id, c])
      ).values()
    );
    const formClasses = sortClassesSerially(uniqueFormClasses);
    if (formClasses.length > 0) {
      return formClasses.map((formClass) => {
        const gradeLabel = formClass.grade ? (GRADE_LEVEL_LABELS[formClass.grade] ?? formClass.grade) : '';
        const dept = formClass.department && formClass.department !== 'Nill' ? formClass.department : undefined;
        const className = composeClassName(gradeLabel, dept, formClass.section) || 'Assigned Class';
        return {
          id: `form-teacher-${formClass.id}`,
          classId: formClass.id,
          className,
          status: 'Accepted' as const,
          sent: '',
          expires: '',
          email: email ?? '',
          teacherId: userId,
          name,
        };
      });
    }
  }

  // 2. Retain invitation-based assignment info ONLY for pending invitations
  if (Array.isArray(list)) {
    const pending = list.filter(
      (i) =>
        i.status === 'Pending' &&
        ((classId && i.classId === classId) ||
         (email && i.email.toLowerCase() === email) ||
         (name && i.name?.toLowerCase() === name.toLowerCase()))
    );
    if (pending.length > 0) return pending;
  }

  return [];
}

/** The primary class a given teacher is form teacher of (or invited to lead) */
export function assignmentForTeacher(
  list: TeacherInvitation[],
  teacher: string | { name?: string; fullName?: string; email?: string; userId?: string; classId?: string | null; classes?: Array<string | TeacherClassAssignment> }
): TeacherInvitation | null {
  return assignmentsForTeacher(list, teacher)[0] ?? null;
}

export interface DeduplicatedTeacherSubject {
  key: string;
  id: string;
  title: string;
  classIds: string[];
}

export function dedupeTeacherSubjects(
  subjects?: TeacherSubject[] | null
): DeduplicatedTeacherSubject[] {
  if (!subjects || subjects.length === 0) return [];

  const deduped = new Map<string, DeduplicatedTeacherSubject>();

  for (const subject of subjects) {
    const id = (subject.id || '').trim();
    const title = (subject.title || '').trim();
    if (!id && !title) continue;

    const normalizedTitle = title.toLowerCase();
    const key = id ? `id:${id}` : `title:${normalizedTitle}`;
    const existing = deduped.get(key);

    if (existing) {
      if (!existing.title && title) {
        existing.title = title;
      }
      if (subject.classId && !existing.classIds.includes(subject.classId)) {
        existing.classIds.push(subject.classId);
      }
      continue;
    }

    deduped.set(key, {
      key,
      id,
      title: title || id,
      classIds: subject.classId ? [subject.classId] : [],
    });
  }

  return Array.from(deduped.values());
}

export const DEPARTMENTS = ['Sciences', 'Humanities', 'Technology', 'Arts'];

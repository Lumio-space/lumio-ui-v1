'use client';

/**
 * TeacherDetailModal
 *
 * Detailed view modal for a teacher's profile, subjects, ratings,
 * and class assignment status.
 */

import React from 'react';
import {
  StarIcon,
  ClipboardCheckIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Progress } from '@/components/shared/Progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  isActiveClass,
  sortClassesSerially,
} from '@/features/classes/constants';
import {
  assignmentsForTeacher,
  assignmentLabel,
  dedupeTeacherSubjects,
  inviteStatusTone,
} from '../constants';
import type { ClassRecord } from '@/features/classes/types';
import type { TeacherRecord, TeacherInvitation, TeacherClassAssignment } from '../types';

interface TeacherDetailModalProps {
  teacher: TeacherRecord | null;
  invitations?: TeacherInvitation[];
  classes?: ClassRecord[];
  onClose: () => void;
  onToggleStatus?: (teacher: TeacherRecord) => void;
  onAssignFormTeacher?: (teacher: TeacherRecord) => void;
  onAssignSubject?: (teacher: TeacherRecord) => void;
}

function resolveClassEntryById(
  classId: string,
  classes?: ClassRecord[],
  teacherClasses?: TeacherRecord['classes']
): {
  id: string;
  label: string;
  level?: string | null;
  grade?: string | null;
  department?: string | null;
  section?: string | null;
} {
  const fromClasses = classes?.find((c) => c.id === classId && isActiveClass(c));
  if (fromClasses) {
    const rawGrade = fromClasses.grade || (fromClasses as any).gradeLevel || '';
    const rawSection = fromClasses.section || (fromClasses as any).gradeSection || '';
    const label =
      composeClassName(
        rawGrade ? (GRADE_LEVEL_LABELS[rawGrade] ?? rawGrade) : '',
        fromClasses.department && fromClasses.department !== 'Nill'
          ? fromClasses.department
          : undefined,
        rawSection
      ) ||
      (fromClasses as any).name ||
      classId;
    return {
      id: classId,
      label,
      level: fromClasses.level,
      grade: rawGrade,
      department: fromClasses.department,
      section: rawSection,
    };
  }

  const fromTeacher = teacherClasses?.find(
    (c): c is TeacherClassAssignment =>
      typeof c !== 'string' &&
      c.id === classId &&
      isActiveClass(c as { deletedAt?: string | null })
  );
  if (fromTeacher) {
    const label =
      composeClassName(
        fromTeacher.grade
          ? (GRADE_LEVEL_LABELS[fromTeacher.grade] ?? fromTeacher.grade)
          : '',
        fromTeacher.department && fromTeacher.department !== 'Nill'
          ? fromTeacher.department
          : undefined,
        fromTeacher.section
      ) || classId;
    return {
      id: classId,
      label,
      level: fromTeacher.level,
      grade: fromTeacher.grade,
      department: fromTeacher.department,
      section: fromTeacher.section,
    };
  }

  return { id: classId, label: classId };
}

export function TeacherDetailModal({
  teacher,
  invitations,
  classes,
  onClose,
  onToggleStatus,
  onAssignFormTeacher,
  onAssignSubject,
}: TeacherDetailModalProps) {
  if (!teacher) return null;

  const teacherName = teacher.fullName || teacher.name || 'Teacher';
  const assignments = assignmentsForTeacher(invitations || [], teacher);
  const primaryAssignment = assignments[0] ?? null;
  const subjects = dedupeTeacherSubjects(teacher.subjects);
  const subjectsWithClasses = subjects.filter((s) => s.classIds.length > 0);
  const rating = typeof teacher.rating === 'number' ? teacher.rating : null;
  const attendance = typeof teacher.attendance === 'number' ? teacher.attendance : null;
  const email = teacher.email || primaryAssignment?.email;
  const phone = teacher.phone;
  const roleDisplay = teacher.role ? teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1).toLowerCase() : 'Teacher';

  const objectClassMap = new Map<string, TeacherClassAssignment>();
  const stringClasses: string[] = [];

  for (const item of teacher.classes || []) {
    if (typeof item === 'string') {
      if (item && !stringClasses.includes(item)) stringClasses.push(item);
    } else if (
      item &&
      typeof item === 'object' &&
      isActiveClass(item as { deletedAt?: string | null })
    ) {
      const existing = objectClassMap.get(item.id);
      objectClassMap.set(
        item.id,
        existing
          ? {
              ...existing,
              ...item,
              isFormTeacher: Boolean(existing.isFormTeacher || item.isFormTeacher),
            }
          : item
      );
    }
  }

  const sortedObjectClasses = sortClassesSerially(Array.from(objectClassMap.values()));

  return (
    <Modal
      open={!!teacher}
      onClose={onClose}
      title="Teacher profile"
      size="lg"
    >
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={teacherName} src={teacher.avatar} size="xl" ring />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-extrabold text-slate-900 truncate">
              {teacherName}
            </h3>
            <p className="text-sm text-slate-500">
              {roleDisplay}
              {teacher.department ? ` · ${teacher.department}` : ''}
              {teacher.staffNo ? ` · ${teacher.staffNo}` : ''}
            </p>
            {subjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <Badge key={s.key} tone="purple">
                    {s.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {rating !== null && (
            <div className="flex items-center gap-1 rounded-xl bg-gold-50 px-3 py-2 font-bold text-gold-600">
              <StarIcon className="h-4 w-4 fill-gold-400 text-gold-400" />
              <span>{rating}</span>
            </div>
          )}
        </div>

        {/* Class assignment / form teacher status */}
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ClipboardCheckIcon className="h-4 w-4" />
            <span>Class assignment</span>
          </p>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={cn(
                    'rounded-xl border p-4',
                    assignment.status === 'Accepted'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gold-200 bg-gold-50'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold text-slate-900">
                        {assignment.className}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <span>Form Teacher</span>
                        {assignment.status === 'Accepted' && (
                          <CheckIcon
                            className="h-4 w-4 text-emerald-600"
                            strokeWidth={3}
                          />
                        )}
                      </p>
                    </div>
                    <Badge tone={inviteStatusTone[assignment.status]} dot>
                      {assignmentLabel(assignment.status)}
                    </Badge>
                  </div>

                  {Boolean(assignment.subjects && assignment.subjects.length > 0) && (
                    <div className="mt-3 border-t border-white/60 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Assigned subjects
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {assignment.subjects?.map((s) => (
                          <Badge key={s} tone="indigo">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Not assigned as form teacher of any class.
            </div>
          )}
        </div>

        {/* Contact info & Membership */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <MailIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Email</p>
              <p className="truncate text-sm font-semibold text-slate-700">
                {email || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <PhoneIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Phone</p>
              <p className="truncate text-sm font-semibold text-slate-700">
                {phone || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Teaching classes */}
        {(sortedObjectClasses.length > 0 || stringClasses.length > 0) && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Teaching classes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sortedObjectClasses.map((c) => {
                const label = composeClassName(
                  c.grade ? (GRADE_LEVEL_LABELS[c.grade] ?? c.grade) : '',
                  c.department && c.department !== 'Nill' ? c.department : undefined,
                  c.section
                );
                const isFormTeacher = Boolean(c.isFormTeacher);
                return (
                  <Badge key={c.id} tone={isFormTeacher ? 'indigo' : 'slate'}>
                    {label || 'Class'}
                    {isFormTeacher && ' · Form Teacher'}
                  </Badge>
                );
              })}
              {stringClasses.map((c) => (
                <Badge key={c} tone="slate">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subject-class breakdown */}
        {subjectsWithClasses.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Subject assignments
            </p>
            <div className="space-y-1.5">
              {subjectsWithClasses.map((s) => {
                const classLabels = sortClassesSerially(
                  s.classIds.map((cid) =>
                    resolveClassEntryById(cid, classes, teacher.classes)
                  )
                ).map((entry) => entry.label);
                return (
                  <div
                    key={s.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{s.title}</span>
                    <span className="text-slate-500">
                      {classLabels.join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance - only show if real data exists */}
        {attendance !== null && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Attendance</span>
              <span className="font-bold text-slate-900">{attendance}%</span>
            </div>
            <Progress value={attendance} tone="green" />
          </div>
        )}

        {/* Modal actions footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            {onAssignFormTeacher && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignFormTeacher(teacher)}
              >
                Assign Form Teacher
              </Button>
            )}
            {onAssignSubject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignSubject(teacher)}
              >
                Assign Subject
              </Button>
            )}
            {onToggleStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(teacher)}
              >
                {teacher.status === 'active' ? 'Mark inactive' : 'Mark active'}
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

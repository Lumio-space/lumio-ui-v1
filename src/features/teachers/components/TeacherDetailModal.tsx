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
  assignmentForTeacher,
  assignmentLabel,
  inviteStatusTone,
} from '../constants';
import type { TeacherRecord, TeacherInvitation, TeacherClassAssignment } from '../types';

interface TeacherDetailModalProps {
  teacher: TeacherRecord | null;
  invitations: TeacherInvitation[];
  onClose: () => void;
  onToggleStatus?: (teacher: TeacherRecord) => void;
  onAssignFormTeacher?: (teacher: TeacherRecord) => void;
  onAssignSubject?: (teacher: TeacherRecord) => void;
}

export function TeacherDetailModal({
  teacher,
  invitations,
  onClose,
  onToggleStatus,
  onAssignFormTeacher,
  onAssignSubject,
}: TeacherDetailModalProps) {
  if (!teacher) return null;

  const teacherName = teacher.fullName || teacher.name || 'Teacher';
  const assignment = assignmentForTeacher(invitations, teacher);
  const subjects = teacher.subjects || [];
  const rating = typeof teacher.rating === 'number' ? teacher.rating : null;
  const attendance = typeof teacher.attendance === 'number' ? teacher.attendance : null;
  const email = teacher.email || assignment?.email;
  const phone = teacher.phone;
  const roleDisplay = teacher.role ? teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1).toLowerCase() : 'Teacher';

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
                  <Badge key={s.id || s.title} tone="purple">
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
          {assignment ? (
            <div
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
        {teacher.classes && teacher.classes.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Teaching classes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {teacher.classes.map((c, idx) => {
                const label = typeof c === 'string'
                  ? c
                  : `${c.grade || ''} ${c.section || ''} ${c.department && c.department !== 'Nill' ? `(${c.department})` : ''}`.trim();
                const isFormTeacher = typeof c !== 'string' && c.isFormTeacher;
                return (
                  <Badge key={typeof c === 'string' ? c : c.id || idx} tone={isFormTeacher ? 'indigo' : 'slate'}>
                    {label || 'Class'}
                    {isFormTeacher && ' · Form Teacher'}
                  </Badge>
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

'use client';

/**
 * TeachingContextModal
 *
 * Subject + Class teaching workspace modal.
 * Migrated from lumio-react/src/components/teacher/TeachingContextModal.tsx.
 *
 * Scopes actions (attendance, learning materials) strictly to this teaching assignment.
 * Permits parent messaging only when the teacher is the appointed Form Teacher.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UsersIcon,
  CalendarCheckIcon,
  FileTextIcon,
  BookMarkedIcon,
  PencilRulerIcon,
  LockIcon,
  MessageSquareIcon,
  UserIcon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { useStudents } from '@/features/students/hooks';
import { MessageParentModal } from '@/features/parents/components/MessageParentModal';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';
import type { StudentRecord } from '@/features/students/types';

interface TeachingContextModalProps {
  open: boolean;
  subject: SubjectRecord | null;
  classRecord: ClassRecord | null;
  currentTeacherName: string;
  isFormTeacher: boolean;
  onClose: () => void;
}

const SCOPED_ACTIONS = [
  {
    icon: CalendarCheckIcon,
    label: 'Take Attendance',
    hint: 'Mark daily register',
    href: (classId: string) => `/attendance?classId=${classId}`,
  },
  {
    icon: PencilRulerIcon,
    label: 'Assessments',
    hint: 'Tests & Continuous Assessments',
    href: () => null,
  },
  {
    icon: FileTextIcon,
    label: 'Assignments',
    hint: 'Set & collect coursework',
    href: () => null,
  },
  {
    icon: BookMarkedIcon,
    label: 'Learning Materials',
    hint: 'Syllabus & references',
    href: () => null,
  },
];

export function TeachingContextModal({
  open,
  subject,
  classRecord,
  currentTeacherName,
  isFormTeacher,
  onClose,
}: TeachingContextModalProps) {
  const [messagingStudent, setMessagingStudent] = useState<StudentRecord | null>(null);

  const { data: studentsResponse, isLoading: studentsLoading } = useStudents(
    classRecord ? { classId: classRecord.id } : undefined
  );

  const students: StudentRecord[] = studentsResponse?.data || [];

  if (!subject || !classRecord) return null;

  const isSenior = classRecord.level?.toLowerCase().includes('senior');
  const configIncomplete = isSenior && (!subject.department || !subject.type);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${subject.name} — ${classRecord.grade} ${classRecord.section}`}
        description={`Teaching context and student roster for ${classRecord.grade} ${classRecord.section}.`}
        size="lg"
        footer={
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Read-only configuration badges set by School Admin */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="indigo">{classRecord.level}</Badge>
            {classRecord.department && classRecord.department !== 'Nill' && (
              <Badge tone="purple" dot>
                {classRecord.department}
              </Badge>
            )}
            {subject.type && <Badge tone="slate">{subject.type}</Badge>}
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <LockIcon className="h-3 w-3" />
              Set by school administrator
            </span>
          </div>

          {configIncomplete && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Subject configuration incomplete for Senior Secondary. Please contact your administrator.
            </div>
          )}

          {/* Responsibilities: Subject Teacher vs. Form Teacher cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                Subject Teacher
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Avatar name={currentTeacherName} size="sm" />
                <span className="text-sm font-semibold text-slate-800">
                  {currentTeacherName}
                </span>
              </div>
              <p className="mt-1 text-xs text-purple-700">
                You teach {subject.name} to this class.
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                isFormTeacher
                  ? 'border-gold-300 bg-gold-50/60'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${
                    isFormTeacher ? 'text-gold-700' : 'text-slate-500'
                  }`}
                >
                  Form Teacher
                </p>
                {isFormTeacher && (
                  <Badge tone="gold" dot>
                    That&rsquo;s you
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {classRecord.formTeacher ? (
                  <>
                    <Avatar name={classRecord.formTeacher} size="sm" />
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {classRecord.formTeacher}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <UserIcon className="h-3.5 w-3.5" />
                    Not assigned
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {isFormTeacher
                  ? 'You are the appointed pastoral lead for this class cohort.'
                  : 'Pastoral lead for this class.'}
              </p>
            </div>
          </div>

          {/* Scoped Actions */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Work with {subject.name} · {classRecord.grade} {classRecord.section}
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {SCOPED_ACTIONS.map((a) => {
                const targetUrl = a.href(classRecord.id);
                if (targetUrl) {
                  return (
                    <Link
                      key={a.label}
                      href={targetUrl}
                      onClick={onClose}
                      className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50/50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 transition-colors group-hover:bg-white">
                        <a.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{a.label}</p>
                        <p className="text-[11px] text-slate-400">{a.hint}</p>
                      </div>
                    </Link>
                  );
                }

                return (
                  <div
                    key={a.label}
                    className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left opacity-75"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{a.label}</p>
                      <p className="text-[11px] text-slate-400">{a.hint}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enrolled Students Roster */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                Class Roster ({students.length || classRecord.students || 0} students)
              </p>
              {isFormTeacher && (
                <span className="text-[11px] font-semibold text-gold-700">
                  Form Teacher pastoral access active
                </span>
              )}
            </div>

            {studentsLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading students…
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                No individual student profiles enrolled in this class register yet.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={student.name || student.fullName} size="xs" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {student.name || student.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {student.admissionNo} · {student.attendance ?? 92}% attendance
                        </p>
                      </div>
                    </div>

                    {isFormTeacher ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMessagingStudent(student)}
                        leftIcon={<MessageSquareIcon className="h-3 w-3" />}
                        className="text-xs text-purple-700 hover:text-purple-900"
                      >
                        Message Parent
                      </Button>
                    ) : (
                      <Badge tone="slate">{student.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Form Teacher Parent Communication Modal */}
      {messagingStudent && (
        <MessageParentModal
          open={Boolean(messagingStudent)}
          parentName={messagingStudent.parent || `Parent of ${messagingStudent.name}`}
          studentName={messagingStudent.name || messagingStudent.fullName}
          parentEmail={messagingStudent.parentEmail}
          onClose={() => setMessagingStudent(null)}
        />
      )}
    </>
  );
}

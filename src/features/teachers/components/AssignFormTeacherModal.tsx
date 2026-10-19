'use client';

/**
 * AssignFormTeacherModal
 *
 * Faithfully mirrors lumio-react src/pages/TeachersPage.tsx:
 * Allows assigning an existing, accepted teacher as Form Teacher of a class.
 * Supports both:
 * 1. Teacher-first mode: assigning a class to a selected teacher.
 * 2. Class-first mode: assigning an active, accepted teacher to a selected class.
 */

import React, { useState, useMemo } from 'react';
import { SchoolIcon, AlertCircleIcon, CheckIcon, UsersIcon, PlusIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/Avatar';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { useAssignFormTeacher, useTeachers } from '../hooks';
import type { TeacherRecord } from '../types';
import { cn } from '@/lib/utils';

interface AssignFormTeacherModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: TeacherRecord | null;
  targetClass?: ClassRecord | null;
  onInviteTeacher?: () => void;
  onSuccess?: () => void;
}

export function AssignFormTeacherModal({
  open,
  onClose,
  teacher,
  targetClass,
  onInviteTeacher,
  onSuccess,
}: AssignFormTeacherModalProps) {
  const { data: rawClasses = [], isLoading: classesLoading } = useClasses();
  const { data: rawTeachers = [], isLoading: teachersLoading } = useTeachers();
  const assignMutation = useAssignFormTeacher();
  const [formError, setFormError] = useState<string | null>(null);

  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    const anyData = rawClasses as { data?: unknown; classes?: unknown; items?: unknown };
    if (Array.isArray(anyData?.data)) return anyData.data as ClassRecord[];
    if (Array.isArray(anyData?.classes)) return anyData.classes as ClassRecord[];
    if (Array.isArray(anyData?.items)) return anyData.items as ClassRecord[];
    return [];
  }, [rawClasses]);

  const teachers: TeacherRecord[] = useMemo(() => {
    if (Array.isArray(rawTeachers)) return rawTeachers;
    const anyData = rawTeachers as { data?: unknown; teachers?: unknown; items?: unknown };
    if (Array.isArray(anyData?.data)) return anyData.data as TeacherRecord[];
    if (Array.isArray(anyData?.teachers)) return anyData.teachers as TeacherRecord[];
    if (Array.isArray(anyData?.items)) return anyData.items as TeacherRecord[];
    return [];
  }, [rawTeachers]);

  // Only active, accepted teachers can be assigned as form teachers
  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => t.status === 'active');
  }, [teachers]);

  const teacherName = teacher?.fullName || teacher?.name || 'Teacher';
  const teacherId = teacher?.userId || teacher?.teacherId || teacher?.id;

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  const targetClassName = targetClass ? formatClassName(targetClass) : '';

  // Mode 1: Assign class to teacher
  async function handleSelectClass(cls: ClassRecord) {
    if (!teacherId) return;
    setFormError(null);

    try {
      await assignMutation.mutateAsync({
        classId: cls.id,
        teacherId,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to assign form teacher');
      setFormError(message);
    }
  }

  // Mode 2: Assign teacher to class
  async function handleSelectTeacher(t: TeacherRecord) {
    if (!targetClass) return;
    const selectedTeacherId = t.userId || t.teacherId || t.id;
    if (!selectedTeacherId) return;
    setFormError(null);

    try {
      await assignMutation.mutateAsync({
        classId: targetClass.id,
        teacherId: selectedTeacherId,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to assign form teacher');
      setFormError(message);
    }
  }

  const isClassMode = Boolean(targetClass && !teacher);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign form teacher"
      description={
        isClassMode
          ? `Choose an active teacher to lead ${targetClassName} as form teacher.`
          : teacher
          ? `Choose the class ${teacherName} will lead as form teacher.`
          : 'Choose a class or teacher to assign.'
      }
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {isClassMode ? (
          /* ================= Class Mode: Select from Active Teachers ================= */
          teachersLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : activeTeachers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3">
                <UsersIcon className="h-6 w-6" />
              </span>
              <p className="font-semibold text-slate-800">No eligible teachers available</p>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                Only teachers who have accepted their school invitation can be assigned as form teachers.
              </p>
              {onInviteTeacher && (
                <div className="mt-5">
                  <Button
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => {
                      onClose();
                      onInviteTeacher();
                    }}
                  >
                    Invite teacher
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {activeTeachers.map((t) => {
                const tId = t.userId || t.teacherId || t.id;
                const isCurrent = targetClass?.formTeacher === tId;
                const leadsOtherClass = Boolean(
                  t.classId && t.classId !== targetClass?.id
                );
                const name = t.fullName || t.name || 'Teacher';

                return (
                  <button
                    key={t.id || tId}
                    type="button"
                    onClick={() => !isCurrent && handleSelectTeacher(t)}
                    disabled={isCurrent || assignMutation.isPending}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                      isCurrent
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50/40'
                    )}
                  >
                    <Avatar name={name} src={t.avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{name}</span>
                        {t.department && (
                          <Badge tone="purple" className="shrink-0 text-xs">
                            {t.department}
                          </Badge>
                        )}
                      </div>
                      <span className="block truncate text-xs text-slate-500">
                        {t.email}
                      </span>
                    </div>

                    {isCurrent ? (
                      <Badge tone="green" dot>
                        <CheckIcon className="h-3 w-3 mr-0.5 inline" />
                        Current
                      </Badge>
                    ) : leadsOtherClass ? (
                      <Badge tone="slate">Assigned</Badge>
                    ) : (
                      <Badge tone="indigo">Available</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* ================= Teacher Mode: Select from Classes ================= */
          classesLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No classes available.
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {classes.map((c) => {
                const isCurrent =
                  c.formTeacher === teacherId ||
                  (teacher?.classes &&
                    teacher.classes.some((cl) =>
                      typeof cl === 'string'
                        ? cl === c.id
                        : cl.id === c.id && cl.isFormTeacher
                    ));
                const takenByOther = Boolean(c.formTeacher && c.formTeacher !== teacherId);
                const displayName = formatClassName(c);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => !takenByOther && !isCurrent && handleSelectClass(c)}
                    disabled={takenByOther || isCurrent || assignMutation.isPending}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                      takenByOther
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                        : isCurrent
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40'
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <SchoolIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{displayName}</span>
                        {c.department && c.department !== 'Nill' && (
                          <Badge
                            tone={
                              DEPARTMENT_TONES[
                                c.department as keyof typeof DEPARTMENT_TONES
                              ] || 'purple'
                            }
                          >
                            {c.department}
                          </Badge>
                        )}
                      </div>
                      <span className="block text-xs text-slate-500">
                        Room {c.room || '—'} · {c.students ?? 0} students
                      </span>
                    </div>

                    {takenByOther ? (
                      <Badge tone="slate">Assigned to other</Badge>
                    ) : isCurrent ? (
                      <Badge tone="green" dot>
                        <CheckIcon className="h-3 w-3 mr-0.5 inline" />
                        Current
                      </Badge>
                    ) : (
                      <Badge tone="slate">Unassigned</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </Modal>
  );
}

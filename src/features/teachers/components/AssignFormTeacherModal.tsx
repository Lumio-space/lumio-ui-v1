'use client';

/**
 * AssignFormTeacherModal
 *
 * Faithfully mirrors lumio-react src/pages/TeachersPage.tsx:
 * Allows assigning an existing teacher as Form Teacher of an unassigned class.
 */

import React, { useState } from 'react';
import { SchoolIcon, AlertCircleIcon, CheckIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { useAssignFormTeacher } from '../hooks';
import type { TeacherRecord } from '../types';
import { cn } from '@/lib/utils';

interface AssignFormTeacherModalProps {
  open: boolean;
  onClose: () => void;
  teacher: TeacherRecord | null;
  onSuccess?: () => void;
}

export function AssignFormTeacherModal({
  open,
  onClose,
  teacher,
  onSuccess,
}: AssignFormTeacherModalProps) {
  const { data: rawClasses = [], isLoading: classesLoading } = useClasses();
  const assignMutation = useAssignFormTeacher();
  const [formError, setFormError] = useState<string | null>(null);

  const classes: ClassRecord[] = Array.isArray(rawClasses)
    ? rawClasses
    : (rawClasses as any)?.data || (rawClasses as any)?.classes || [];

  const teacherName = teacher?.fullName || teacher?.name || 'Teacher';
  const teacherId = teacher?.userId || teacher?.teacherId || teacher?.id;

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

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
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to assign form teacher');
      setFormError(message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign form teacher"
      description={
        teacher
          ? `Choose the class ${teacherName} will lead as form teacher.`
          : 'Choose a class to assign.'
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

        {classesLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
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
        )}
      </div>
    </Modal>
  );
}

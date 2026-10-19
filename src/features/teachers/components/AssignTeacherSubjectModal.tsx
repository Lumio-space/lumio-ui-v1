'use client';

/**
 * AssignTeacherSubjectModal
 *
 * Modal to assign an existing teacher to a subject within a specific class.
 */

import React, { useState } from 'react';
import { BookOpenIcon, SchoolIcon, AlertCircleIcon, CheckIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';
import { useAssignTeacherSubject } from '../hooks';
import type { TeacherRecord } from '../types';

interface AssignTeacherSubjectModalProps {
  open: boolean;
  onClose: () => void;
  teacher: TeacherRecord | null;
  onSuccess?: () => void;
}

export function AssignTeacherSubjectModal({
  open,
  onClose,
  teacher,
  onSuccess,
}: AssignTeacherSubjectModalProps) {
  const { data: rawClasses = [], isLoading: classesLoading } = useClasses();
  const { data: rawSubjects = [], isLoading: subjectsLoading } = useSubjects();
  const assignMutation = useAssignTeacherSubject();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const classes: ClassRecord[] = Array.isArray(rawClasses)
    ? rawClasses
    : (rawClasses as any)?.data || (rawClasses as any)?.classes || [];

  const subjects: SubjectRecord[] = Array.isArray(rawSubjects)
    ? rawSubjects
    : (rawSubjects as any)?.data || (rawSubjects as any)?.subjects || [];

  const teacherName = teacher?.fullName || teacher?.name || 'Teacher';
  const teacherId = teacher?.userId || teacher?.teacherId || teacher?.id;

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  async function handleAssign() {
    if (!teacherId || !selectedClassId || !selectedSubjectId) {
      setFormError('Please select both a class and a subject');
      return;
    }
    setFormError(null);

    try {
      await assignMutation.mutateAsync({
        teacherId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to assign subject');
      setFormError(message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign subject course"
      description={
        teacher
          ? `Allocate a class subject course for ${teacherName} to teach.`
          : 'Assign a subject to teach.'
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            loading={assignMutation.isPending}
            disabled={!selectedClassId || !selectedSubjectId || assignMutation.isPending}
            leftIcon={<CheckIcon className="h-4 w-4" />}
          >
            Assign subject
          </Button>
        </>
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

        <div>
          <label
            htmlFor="assign-class-select"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Class cohort
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SchoolIcon className="h-4 w-4" />
            </span>
            <select
              id="assign-class-select"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setFormError(null);
              }}
              disabled={classesLoading}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatClassName(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="assign-subject-select"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Subject
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <BookOpenIcon className="h-4 w-4" />
            </span>
            <select
              id="assign-subject-select"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setFormError(null);
              }}
              disabled={subjectsLoading}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || s.department || s.section})
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          This registers the teacher to the chosen class subject offering so they can record academic scores and curriculum milestones.
        </p>
      </div>
    </Modal>
  );
}

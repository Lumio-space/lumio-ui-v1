'use client';

/**
 * AssignTeacherSubjectModal
 *
 * Modal to assign an existing teacher to a subject within a specific class.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BookOpenIcon, SchoolIcon, AlertCircleIcon, CheckIcon, CheckSquareIcon, SquareIcon, InfoIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
} from '@/features/classes/constants';
import { SECTION_TO_BACKEND_ENUM } from '@/features/subjects/api/subjects.api';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';
import { useAssignTeacherSubject } from '../hooks';
import type { TeacherRecord } from '../types';
import { cn } from '@/lib/utils';

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

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const subjects: SubjectRecord[] = useMemo(() => {
    if (Array.isArray(rawSubjects)) return rawSubjects;
    return (rawSubjects as any)?.data || (rawSubjects as any)?.subjects || [];
  }, [rawSubjects]);

  const teacherName = teacher?.fullName || teacher?.name || 'Teacher';
  const teacherId = teacher?.userId || teacher?.teacherId || teacher?.id;

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Filter available classes based on whether the selected subject is offered in those classes
  const eligibleClasses = useMemo(() => {
    if (!selectedSubject) return classes;

    // 1. Explicit class assignments stored on the subject record
    if (Array.isArray(selectedSubject.classIds) && selectedSubject.classIds.length > 0) {
      const explicit = classes.filter((c) => selectedSubject.classIds!.includes(c.id));
      if (explicit.length > 0) return explicit;
    }

    // 2. Filter by school section/level and department if Senior Secondary
    if (selectedSubject.section) {
      const normalizedSection =
        SECTION_TO_BACKEND_ENUM[selectedSubject.section] || selectedSubject.section.toLowerCase();

      return classes.filter((c) => {
        const classLvl = (c.level || '').toLowerCase().replace(/[\s_-]+/g, '');
        const targetLvl = normalizedSection.toLowerCase().replace(/[\s_-]+/g, '');
        if (classLvl !== targetLvl) return false;

        if (
          targetLvl === 'seniorsecondary' &&
          selectedSubject.department &&
          selectedSubject.department !== 'All departments'
        ) {
          return c.department === selectedSubject.department;
        }
        return true;
      });
    }

    return classes;
  }, [classes, selectedSubject]);

  // Remove any selections that become ineligible when subject changes
  useEffect(() => {
    if (selectedClassIds.length > 0) {
      setSelectedClassIds((prev) =>
        prev.filter((id) => eligibleClasses.some((c) => c.id === id))
      );
    }
  }, [eligibleClasses]);

  // Reset state on modal open/close
  useEffect(() => {
    if (!open) {
      setSelectedClassIds([]);
      setSelectedSubjectId('');
      setFormError(null);
    }
  }, [open]);

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  function toggleClassSelection(classId: string) {
    setFormError(null);
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  }

  function handleSelectAll() {
    setFormError(null);
    if (selectedClassIds.length === eligibleClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(eligibleClasses.map((c) => c.id));
    }
  }

  async function handleAssign() {
    if (!teacherId || selectedClassIds.length === 0 || !selectedSubjectId) {
      setFormError('Please select a subject and at least one class cohort.');
      return;
    }

    // Backend contract check: POST /teachers/assign-subject-to-teacher DTO currently only accepts classId (single string)
    if (selectedClassIds.length > 1) {
      setFormError(
        'The backend API currently only supports single-class assignment (classId). Batch assignment requires a backend update. Please select one class at a time.'
      );
      return;
    }

    setFormError(null);

    try {
      await assignMutation.mutateAsync({
        teacherId,
        classId: selectedClassIds[0],
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

  const isBatchSelected = selectedClassIds.length > 1;

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
            disabled={
              selectedClassIds.length === 0 ||
              !selectedSubjectId ||
              isBatchSelected ||
              assignMutation.isPending
            }
            leftIcon={<CheckIcon className="h-4 w-4" />}
          >
            {isBatchSelected
              ? `Batch requires backend update (${selectedClassIds.length} classes)`
              : selectedClassIds.length === 1
              ? 'Assign subject'
              : 'Select class'}
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

        {/* 1. Subject Selector */}
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

        {/* 2. Multiple Class Cohort Selector */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Class Cohorts
            </label>
            <div className="flex items-center gap-2">
              {eligibleClasses.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {selectedClassIds.length === eligibleClasses.length
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {selectedClassIds.length} of {eligibleClasses.length} selected
              </span>
            </div>
          </div>

          {classesLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
              Loading classes…
            </div>
          ) : eligibleClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
              {selectedSubject
                ? `No eligible classes offer ${selectedSubject.name}.`
                : 'No classes available.'}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 space-y-1">
              {eligibleClasses.map((c) => {
                const isSelected = selectedClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClassSelection(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all',
                      isSelected
                        ? 'border border-indigo-200 bg-indigo-50/70 text-indigo-950 font-medium'
                        : 'border border-transparent hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <span>{formatClassName(c)}</span>
                    </div>
                    {c.room && (
                      <span className="text-xs text-slate-400">Room {c.room}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Backend Limitation Notice when multiple classes are selected */}
        {isBatchSelected && (
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Backend Limitation</p>
              <p className="mt-0.5">
                You selected {selectedClassIds.length} classes. The backend endpoint (
                <code>POST /teachers/assign-subject-to-teacher</code>) currently only accepts a single{' '}
                <code>classId</code>. Please select one class at a time to assign, or wait for backend batch assignment support.
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          This registers the teacher to the chosen class subject offering so they can record academic scores and curriculum milestones.
        </p>
      </div>
    </Modal>
  );
}

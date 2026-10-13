'use client';

/**
 * AssignTeacherModal
 *
 * Migrated from lumio-react src/components/subjects/AssignTeacherModal.tsx.
 * Assigns a teacher to a specific class offering of a subject.
 */

import { useState } from 'react';
import { CheckIcon, UserIcon, SearchIcon, InfoIcon, AlertCircleIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import type { SubjectRecord, SubjectOffering } from '../types';
import type { ClassRecord } from '@/features/classes/types';
import { GRADE_LEVEL_LABELS, composeClassName } from '@/features/classes/constants';

export interface TeacherOption {
  id: string;
  name: string;
  sections?: string[];
}

interface AssignTeacherModalProps {
  open: boolean;
  onClose: () => void;
  subject: SubjectRecord | null;
  offering: SubjectOffering | null;
  allOfferings: SubjectOffering[];
  classes: ClassRecord[];
  teachers: TeacherOption[];
  onSave: (offeringId: string, teacherId: string | null) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

export function AssignTeacherModal({
  open,
  onClose,
  subject,
  offering,
  allOfferings,
  classes,
  teachers,
  onSave,
  isSaving = false,
  errorMessage,
}: AssignTeacherModalProps) {
  const [picked, setPicked] = useState<string | null>(
    offering?.teacherIds[0] ?? null
  );
  const [query, setQuery] = useState('');
  const [prevOfferingId, setPrevOfferingId] = useState<string | null>(null);

  if (offering && offering.id !== prevOfferingId) {
    setPrevOfferingId(offering.id);
    setPicked(offering.teacherIds[0] ?? null);
    setQuery('');
  }

  if (!subject || !offering) return null;

  const cls = classes.find((c) => c.id === offering.classId);
  const gradeLabel = cls ? (GRADE_LEVEL_LABELS[cls.grade] ?? cls.grade) : '';
  const classNameDisplay = cls
    ? composeClassName(gradeLabel, cls.department, cls.section)
    : 'Class';

  const matches = teachers.filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const preferred = matches.filter((t) =>
    cls && t.sections && t.sections.includes(cls.level)
  );
  const others = matches.filter(
    (t) => !cls || !t.sections || !t.sections.includes(cls.level)
  );

  function handleSave() {
    if (offering) {
      onSave(offering.id, picked);
    }
  }

  function renderTeacher(t: TeacherOption) {
    const on = picked === t.id;
    const load = allOfferings.filter((o) => o.teacherIds.includes(t.id)).length;

    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setPicked(on ? null : t.id)}
        aria-pressed={on}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
          on
            ? 'border-purple-500 bg-purple-50'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <Avatar name={t.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">
            {t.name}
          </span>
          <span className="block text-xs text-slate-500">
            {load === 0
              ? 'No class offerings yet'
              : `Teaches ${load} class offering${load === 1 ? '' : 's'}`}
          </span>
        </span>
        {on && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
            <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </button>
    );
  }

  const currentTeacherId = offering.teacherIds[0] ?? null;
  const changed = currentTeacherId !== picked;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign teacher"
      description={`This applies to ${subject.name} in ${classNameDisplay} only.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!changed || isSaving}
          >
            {isSaving
              ? 'Saving…'
              : picked
              ? 'Assign teacher'
              : 'Remove teacher'}
          </Button>
        </>
      }
    >
      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Offering Badge */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        <span className="font-bold">{subject.name}</span>
        <span className="text-indigo-400">—</span>
        <Badge tone="indigo">{classNameDisplay}</Badge>
        <span className="text-xs text-indigo-600">
          {cls?.students ?? 0} students
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teachers…"
          aria-label="Search teachers"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Teachers List */}
      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {preferred.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Teaches in {cls?.level}
            </p>
            {preferred.map(renderTeacher)}
          </div>
        )}
        {others.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {preferred.length > 0 ? 'Other teachers' : 'Available teachers'}
            </p>
            {others.map(renderTeacher)}
          </div>
        )}
        {matches.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <UserIcon className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No teachers found.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>
          A teacher can take this subject in several classes, and other subjects
          too. Assigning here does not affect their other offerings.
        </p>
      </div>
    </Modal>
  );
}

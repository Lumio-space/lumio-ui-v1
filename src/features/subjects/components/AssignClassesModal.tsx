'use client';

/**
 * AssignClassesModal
 *
 * Migrated from lumio-react src/components/subjects/AssignClassesModal.tsx.
 * Allows school admins to map a subject to classes across all school sections.
 */

import { useMemo, useState, useEffect } from 'react';
import { CheckIcon, SearchIcon, LayersIcon, AlertCircleIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/lib/utils';
import { SCHOOL_SECTIONS, departmentTone } from '../constants';
import type { SubjectRecord, SubjectOffering, Department } from '../types';
import type { ClassRecord } from '@/features/classes/types';
import { GRADE_LEVEL_LABELS, composeClassName } from '@/features/classes/constants';

interface AssignClassesModalProps {
  open: boolean;
  onClose: () => void;
  subject: SubjectRecord | null;
  classes: ClassRecord[];
  offerings: SubjectOffering[];
  onSave: (classIds: string[]) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

export function AssignClassesModal({
  open,
  onClose,
  subject,
  classes,
  offerings,
  onSave,
  isSaving = false,
  errorMessage = null,
}: AssignClassesModalProps) {
  const current = useMemo(() => {
    if (!subject) return [];
    const fromOfferings = offerings
      .filter((o) => o.subjectId === subject.id)
      .map((o) => o.classId);
    if (fromOfferings.length > 0) return fromOfferings;
    return subject.classIds || [];
  }, [offerings, subject]);

  const [selected, setSelected] = useState<string[]>(current);
  const [query, setQuery] = useState('');

  // Re-seed selection whenever modal opens, subject changes, or current offerings update
  useEffect(() => {
    if (open && subject) {
      setSelected(current);
      setQuery('');
    }
  }, [open, subject?.id, current]);

  if (!subject) return null;

  const filtered = classes.filter((c) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const name = composeClassName(gradeLabel, c.department, c.section);
    return name.toLowerCase().includes(query.trim().toLowerCase());
  });

  function toggle(classId: string) {
    setSelected((s) =>
      s.includes(classId) ? s.filter((x) => x !== classId) : [...s, classId]
    );
  }

  function toggleSection(sectionLabel: string) {
    const sectionClasses = classes.filter((c) => {
      const normLevel = (c.level || '').toLowerCase().replace(/[\s_-]+/g, '');
      const normTarget = sectionLabel.toLowerCase().replace(/[\s_-]+/g, '');
      return normLevel === normTarget;
    });
    const ids = sectionClasses.map((c) => c.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((s) =>
      allOn ? s.filter((x) => !ids.includes(x)) : Array.from(new Set([...s, ...ids]))
    );
  }


  function handleSave() {
    onSave(selected);
  }

  const added = selected.filter((id) => !current.includes(id)).length;
  const removed = current.filter((id) => !selected.includes(id)).length;
  const hasChanges = added > 0 || removed > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign ${subject.name} to classes`}
      description="Choose which classes offer this subject. Teachers are assigned separately for each class."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasChanges || isSaving}
          >
            {isSaving
              ? 'Saving…'
              : hasChanges
              ? `Save ${selected.length} class${selected.length === 1 ? '' : 'es'}`
              : 'No changes'}
          </Button>
        </>
      }
    >
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search classes…"
          aria-label="Search classes"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      <div className="max-h-[22rem] space-y-5 overflow-y-auto pr-1">
        {SCHOOL_SECTIONS.map((section) => {
          const sectionClasses = filtered.filter((c) => {
            const normLevel = (c.level || '').toLowerCase().replace(/[\s_-]+/g, '');
            const normTarget = section.toLowerCase().replace(/[\s_-]+/g, '');
            return normLevel === normTarget;
          });

          if (sectionClasses.length === 0) return null;
          const ids = sectionClasses.map((c) => c.id);
          const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));

          return (
            <div key={section}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {section}
                </p>
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className="text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700"
                >
                  {allOn ? 'Clear section' : 'Select all'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sectionClasses.map((c) => {
                  const on = selected.includes(c.id);
                  const existing = current.includes(c.id);
                  const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                  const classNameDisplay = composeClassName(gradeLabel, c.department, c.section);
                  const deptStr = c.department as string | undefined;
                  const hasValidDept =
                    deptStr &&
                    deptStr !== 'Nill' &&
                    deptStr !== 'none';

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      aria-pressed={on}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                        on
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          on
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-slate-300'
                        )}
                      >
                        {on && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">
                          {classNameDisplay}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {hasValidDept ? (
                            <Badge tone={departmentTone[c.department as Department] ?? 'indigo'}>
                              {c.department}
                            </Badge>
                          ) : (
                            (c.level === 'senior_secondary' || c.level === 'Senior Secondary') && (
                              <Badge tone="gold">No department</Badge>
                            )
                          )}
                          <span className="text-xs text-slate-500">
                            {c.students ?? 0} students
                          </span>
                        </span>
                      </span>

                      {existing && !on && <Badge tone="red">Removing</Badge>}
                      {!existing && on && <Badge tone="green">New</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Other classes if any don't match standard sections */}
        {(() => {
          const assignedIds = new Set(
            SCHOOL_SECTIONS.flatMap((section) =>
              filtered
                .filter((c) => {
                  const normLevel = (c.level || '').toLowerCase().replace(/[\s_-]+/g, '');
                  const normTarget = section.toLowerCase().replace(/[\s_-]+/g, '');
                  return normLevel === normTarget;
                })
                .map((c) => c.id)
            )
          );
          const otherClasses = filtered.filter((c) => !assignedIds.has(c.id));
          if (otherClasses.length === 0) return null;
          const ids = otherClasses.map((c) => c.id);
          const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));

          return (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Other Classes
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelected((s) =>
                      allOn ? s.filter((x) => !ids.includes(x)) : Array.from(new Set([...s, ...ids]))
                    );
                  }}
                  className="text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700"
                >
                  {allOn ? 'Clear section' : 'Select all'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {otherClasses.map((c) => {
                  const on = selected.includes(c.id);
                  const existing = current.includes(c.id);
                  const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                  const classNameDisplay = composeClassName(gradeLabel, c.department, c.section);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      aria-pressed={on}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                        on
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          on
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-slate-300'
                        )}
                      >
                        {on && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">
                          {classNameDisplay}
                        </span>
                        <span className="text-xs text-slate-500">
                          {c.students ?? 0} students
                        </span>
                      </span>

                      {existing && !on && <Badge tone="red">Removing</Badge>}
                      {!existing && on && <Badge tone="green">New</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <LayersIcon className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              No classes match &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}
      </div>


      {(added > 0 || removed > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {added > 0 && (
            <span>
              <span className="font-bold text-emerald-600">+{added}</span> class
              {added === 1 ? '' : 'es'} added
            </span>
          )}
          {added > 0 && removed > 0 && <span className="text-slate-300">·</span>}
          {removed > 0 && (
            <span>
              <span className="font-bold text-red-500">−{removed}</span> removed
            </span>
          )}
          <span className="text-slate-400">
            · new offerings start without a teacher
          </span>
        </div>
      )}
    </Modal>
  );
}

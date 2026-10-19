'use client';

import { useMemo, useState, useEffect } from 'react';
import { PlusIcon, BookOpenIcon, RefreshCwIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { motion }        from 'framer-motion';

import { PageHeader }  from '@/components/shared/PageHeader';
import { EmptyState }  from '@/components/shared/EmptyState';
import { Button }      from '@/components/ui/button';

import { useClasses, useDeleteClass } from '../hooks';
import { useSubjects } from '@/features/subjects/hooks';
import { useTeachers } from '@/features/teachers/hooks';
import { GRADE_LEVEL_LABELS, composeClassName } from '../constants';
import { ClassCard }        from './ClassCard';
import { Modal }            from '@/components/shared/Modal';
import { ClassDetailModal } from './ClassDetailModal';
import { CreateClassForm }  from './CreateClassForm';
import { EditClassModal }   from './EditClassModal';
import type { ClassRecord } from '../types';

const SECTION_GROUPS = [
  { key: 'nursery', label: 'Nursery' },
  { key: 'primary', label: 'Primary' },
  { key: 'junior_secondary', label: 'Junior Secondary' },
  { key: 'senior_secondary', label: 'Senior Secondary' },
] as const;

function matchesSection(classLevel: string | undefined, sectionKey: string): boolean {
  if (!classLevel) return false;
  const norm = classLevel.toLowerCase().replace(/[\s_-]+/g, '');
  const target = sectionKey.toLowerCase().replace(/[\s_-]+/g, '');
  return norm === target;
}

function isUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function ClassesView() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailClass, setDetailClass]         = useState<ClassRecord | null>(null);
  const [classToEdit, setClassToEdit]         = useState<ClassRecord | null>(null);
  const [classToDelete, setClassToDelete]     = useState<ClassRecord | null>(null);
  const [deleteError, setDeleteError]         = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess]     = useState<string | null>(null);

  const { data: classes, isLoading, isError, error, refetch } = useClasses();
  const { data: subjectsData } = useSubjects();
  const { data: teachersData } = useTeachers();
  const deleteClassMutation = useDeleteClass();

  // Map teachers by userId and id for resolving form teachers
  const teacherMap = useMemo(() => {
    const map = new Map<string, string>();
    const list: any[] = Array.isArray(teachersData)
      ? teachersData
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).data))
      ? (teachersData as any).data
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).teachers))
      ? (teachersData as any).teachers
      : [];

    list.forEach((t) => {
      const name = t.fullName || t.name;
      if (name) {
        if (t.userId) map.set(t.userId, name);
        if (t.id) map.set(t.id, name);
      }
    });
    return map;
  }, [teachersData]);

  // Map subjects to classes
  const classSubjectsMap = useMemo(() => {
    if (!subjectsData || subjectsData.length === 0) return {};
    const map: Record<string, string[]> = {};
    subjectsData.forEach((s) => {
      s.classIds?.forEach((cId) => {
        if (!map[cId]) map[cId] = [];
        if (!map[cId].includes(s.name)) {
          map[cId].push(s.name);
        }
      });
    });
    return map;
  }, [subjectsData]);

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => setDeleteSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  const grouped = useMemo(() => {
    if (!classes || classes.length === 0) return [];

    const result: Array<{ section: string; items: ClassRecord[] }> = [];
    const assignedIds = new Set<string>();

    for (const group of SECTION_GROUPS) {
      const items = classes.filter((c) => matchesSection(c.level, group.key));
      if (items.length > 0) {
        items.forEach((c) => assignedIds.add(c.id));
        result.push({ section: group.label, items });
      }
    }

    const remaining = classes.filter((c) => !assignedIds.has(c.id));
    if (remaining.length > 0) {
      result.push({ section: 'Other Classes', items: remaining });
    }

    return result;
  }, [classes]);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <PageHeader
        title="Classes"
        description="Create and manage classes, set the Senior Secondary department, and allocate students."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create class
          </Button>
        }
      />

      {/* Success notification banner */}
      {deleteSuccess && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">{deleteSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccess(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading skeleton — card grid */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <div className="h-24 animate-pulse bg-indigo-900/40" />
              <div className="space-y-3 bg-white p-5">
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <p className="font-semibold text-red-700">
            {error instanceof Error ? error.message : 'Failed to load classes.'}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCwIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && classes?.length === 0 && (
        <EmptyState
          icon={<BookOpenIcon className="h-7 w-7" />}
          title="No classes yet"
          description="Get started by creating your first class. Classes group students by school level and arm."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Create first class
            </Button>
          }
        />
      )}

      {/* Grouped section class cards matching lumio-react */}
      {!isLoading && !isError && grouped.length > 0 && (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.section} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500">
                  {group.section}
                </h2>
                <span className="text-xs text-slate-400">
                  {group.items.length} class{group.items.length === 1 ? '' : 'es'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((cls, i) => {
                  const resolvedTeacherName =
                    cls.teacher ||
                    cls.formTeacherName ||
                    (cls.formTeacher
                      ? teacherMap.get(cls.formTeacher) || (!isUuid(cls.formTeacher) ? cls.formTeacher : undefined)
                      : undefined);

                  const resolvedClass: ClassRecord = {
                    ...cls,
                    teacher: resolvedTeacherName,
                    subjects: cls.subjects && cls.subjects.length > 0 ? cls.subjects : (classSubjectsMap[cls.id] || []),
                  };

                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2) }}
                      className="flex"
                    >
                      <div className="w-full">
                        <ClassCard
                          classRecord={resolvedClass}
                          onViewDetails={(c) => setDetailClass(c)}
                          onEdit={(c) => setClassToEdit(c)}
                          onDelete={(c) => {
                            setDeleteError(null);
                            setClassToDelete(c);
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Create class modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create new class"
        description="Set the class level and section. Senior Secondary classes also carry a department."
        size="md"
      >
        <CreateClassForm onSuccess={() => setCreateModalOpen(false)} onCancel={() => setCreateModalOpen(false)} />
      </Modal>

      {/* Edit class modal */}
      <EditClassModal
        open={!!classToEdit}
        classRecord={classToEdit}
        onClose={() => setClassToEdit(null)}
        onSuccess={() => {
          setClassToEdit(null);
          setDeleteSuccess('Class updated successfully.');
        }}
      />

      {/* Class details modal */}
      <ClassDetailModal
        open={!!detailClass}
        onClose={() => setDetailClass(null)}
        classRecord={
          detailClass
            ? {
                ...detailClass,
                teacher:
                  detailClass.teacher ||
                  (detailClass.formTeacher
                    ? teacherMap.get(detailClass.formTeacher) || (!isUuid(detailClass.formTeacher) ? detailClass.formTeacher : undefined)
                    : undefined),
                subjects:
                  detailClass.subjects && detailClass.subjects.length > 0
                    ? detailClass.subjects
                    : (classSubjectsMap[detailClass.id] || []),
              }
            : null
        }
      />

      {/* Delete class confirmation modal */}
      <Modal
        open={!!classToDelete}
        onClose={() => {
          if (!deleteClassMutation.isPending) {
            setClassToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete class"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setClassToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteClassMutation.isPending}
              disabled={deleteClassMutation.isPending}
              onClick={() => {
                if (!classToDelete) return;
                setDeleteError(null);
                deleteClassMutation.mutate(classToDelete.id, {
                  onSuccess: () => {
                    const gradeLabel = GRADE_LEVEL_LABELS[classToDelete.grade] ?? classToDelete.grade;
                    const name = composeClassName(gradeLabel, classToDelete.department, classToDelete.section);
                    setClassToDelete(null);
                    setDeleteSuccess(`Class "${name}" was successfully deleted.`);
                  },
                  onError: (err) => {
                    const msg = err instanceof Error ? err.message : 'Failed to delete class.';
                    setDeleteError(
                      msg.includes('404')
                        ? 'Failed to delete class. The server does not support deleting classes yet.'
                        : msg
                    );
                  },
                });
              }}
            >
              Delete class
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <strong className="font-semibold text-slate-900">
              {classToDelete
                ? composeClassName(
                    GRADE_LEVEL_LABELS[classToDelete.grade] ?? classToDelete.grade,
                    classToDelete.department,
                    classToDelete.section
                  )
                : 'this class'}
            </strong>
            ? This will remove the class and all associated student allocations.
          </p>
        </div>
      </Modal>
    </div>
  );
}


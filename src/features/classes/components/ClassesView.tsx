'use client';

import { useMemo, useState, useEffect } from 'react';
import { PlusIcon, BookOpenIcon, RefreshCwIcon, AlertCircleIcon, CheckCircle2Icon, LayersIcon } from 'lucide-react';
import { motion }        from 'framer-motion';

import { PageHeader }  from '@/components/shared/PageHeader';
import { EmptyState }  from '@/components/shared/EmptyState';
import { Button }      from '@/components/ui/button';

import { useClasses, useDeleteClass } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import { useTeachers } from '@/features/teachers/hooks';
import { GRADE_LEVEL_LABELS, SCHOOL_LEVEL_LABELS, composeClassName, extractActiveClasses } from '../constants';
import { ClassCard }        from './ClassCard';
import { Modal }            from '@/components/shared/Modal';
import { ClassDetailModal } from './ClassDetailModal';
import { CreateClassForm }  from './CreateClassForm';
import { EditClassModal }   from './EditClassModal';
import type { ClassRecord, SchoolLevel } from '../types';

function isUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function inferLevelFromGrade(grade?: string): SchoolLevel | undefined {
  if (!grade) return undefined;
  const g = grade.toLowerCase().replace(/[\s_-]+/g, '');
  if (g.startsWith('nursery') || g.includes('kindergarten')) return 'nursery';
  if (g.startsWith('primary') || g.includes('basic')) return 'primary';
  if (g.startsWith('jss') || g.includes('junior')) return 'junior_secondary';
  if (g.startsWith('sss') || g.includes('senior')) return 'senior_secondary';
  return undefined;
}

interface DerivedGradeLevel {
  gradeKey: string;
  gradeLabel: string;
  arms: ClassRecord[];
  hasStudentCount: boolean;
  totalStudents: number;
}

interface DerivedSection {
  key: string;
  label: string;
  levels: DerivedGradeLevel[];
  totalArms: number;
}

export function ClassesView() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailClass, setDetailClass]         = useState<ClassRecord | null>(null);
  const [classToEdit, setClassToEdit]         = useState<ClassRecord | null>(null);
  const [classToDelete, setClassToDelete]     = useState<ClassRecord | null>(null);
  const [deleteError, setDeleteError]         = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess]     = useState<string | null>(null);

  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('all');

  const { data: rawClasses, isLoading, isError, error, refetch } = useClasses();
  const classes = useMemo(() => extractActiveClasses<ClassRecord>(rawClasses), [rawClasses]);
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

  // Map classId -> formTeacherName from teachers data to mitigate stale class Redis cache
  const classFormTeacherMap = useMemo(() => {
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
      if (name && Array.isArray(t.classes)) {
        t.classes.forEach((c: any) => {
          if (typeof c === 'object' && c !== null && c.id && Boolean(c.isFormTeacher)) {
            map.set(c.id, name);
          }
        });
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

  // Derive sections and hierarchical grade levels dynamically from loaded class data
  const derivedSections = useMemo(() => {
    if (!classes || classes.length === 0) return [];

    const sectionMap = new Map<string, { label: string; rawClasses: ClassRecord[] }>();

    classes.forEach((c) => {
      const inferred = inferLevelFromGrade(c.grade);
      const rawLevel = c.level?.trim() || inferred || 'unassigned';
      const key = rawLevel.toLowerCase().replace(/[\s_-]+/g, '_');
      const label =
        SCHOOL_LEVEL_LABELS[rawLevel as SchoolLevel] ??
        rawLevel.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

      if (!sectionMap.has(key)) {
        sectionMap.set(key, { label, rawClasses: [] });
      }
      sectionMap.get(key)!.rawClasses.push(c);
    });

    const result: DerivedSection[] = [];

    sectionMap.forEach((entry, key) => {
      // Group classes within this section by grade level
      const gradeMap = new Map<string, ClassRecord[]>();

      entry.rawClasses.forEach((c) => {
        const gradeKey = c.grade || 'unspecified';
        if (!gradeMap.has(gradeKey)) {
          gradeMap.set(gradeKey, []);
        }
        gradeMap.get(gradeKey)!.push(c);
      });

      const levels: DerivedGradeLevel[] = [];

      gradeMap.forEach((armClasses, gradeKey) => {
        // Sort arms alphabetically by arm section letter/name
        const sortedArms = [...armClasses].sort((a, b) =>
          (a.section || '').localeCompare(b.section || '', undefined, { sensitivity: 'base' })
        );

        const gradeLabel = GRADE_LEVEL_LABELS[gradeKey] ?? gradeKey;
        const hasStudentCount = sortedArms.some(
          (a) => typeof a.students === 'number' && a.students > 0
        );
        const totalStudents = hasStudentCount
          ? sortedArms.reduce((sum, a) => sum + (a.students || 0), 0)
          : 0;

        levels.push({
          gradeKey,
          gradeLabel,
          arms: sortedArms,
          hasStudentCount,
          totalStudents,
        });
      });

      // Sort grade levels naturally by grade label
      levels.sort((a, b) =>
        a.gradeLabel.localeCompare(b.gradeLabel, undefined, { numeric: true, sensitivity: 'base' })
      );

      result.push({
        key,
        label: entry.label,
        levels,
        totalArms: entry.rawClasses.length,
      });
    });

    // Sort sections in a predictable order if standard, otherwise alphabetical
    const orderIndex: Record<string, number> = {
      nursery: 0,
      primary: 1,
      junior_secondary: 2,
      senior_secondary: 3,
    };
    result.sort((a, b) => {
      const idxA = orderIndex[a.key] ?? 99;
      const idxB = orderIndex[b.key] ?? 99;
      if (idxA !== idxB) return idxA - idxB;
      return a.label.localeCompare(b.label);
    });

    return result;
  }, [classes]);

  // Sections to display based on navigation selection
  const displayedSections = useMemo(() => {
    if (selectedSectionKey === 'all') return derivedSections;
    return derivedSections.filter((s) => s.key === selectedSectionKey);
  }, [derivedSections, selectedSectionKey]);

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

      {/* Section Navigation Tabs (Derived Dynamically) */}
      {!isLoading && !isError && derivedSections.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setSelectedSectionKey('all')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedSectionKey === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Sections</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedSectionKey === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {classes?.length ?? 0}
            </span>
          </button>
          {derivedSections.map((sec) => {
            const isSelected = selectedSectionKey === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setSelectedSectionKey(sec.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{sec.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sec.totalArms}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hierarchical Class Structure: Section → Class Level → Class Arms → Class Cards */}
      {!isLoading && !isError && displayedSections.length > 0 && (
        <div className="space-y-10">
          {displayedSections.map((sec) => (
            <section key={sec.key} className="space-y-5">
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-base font-bold uppercase tracking-wider text-slate-700">
                    {sec.label}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {sec.totalArms} {sec.totalArms === 1 ? 'arm' : 'arms'}
                  </span>
                </div>
              </div>

              {/* Class Levels within Section */}
              <div className="space-y-6">
                {sec.levels.map((lvl) => (
                  <div
                    key={lvl.gradeKey}
                    className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-slate-800">
                          {lvl.gradeLabel}
                        </h3>
                        <span className="text-xs font-medium text-slate-500">
                          ({lvl.arms.length} {lvl.arms.length === 1 ? 'arm' : 'arms'})
                        </span>
                      </div>
                      {lvl.hasStudentCount && (
                        <span className="text-xs font-medium text-slate-500">
                          {lvl.totalStudents} students enrolled
                        </span>
                      )}
                    </div>

                    {/* Class Arms Grid (Sorted Alphabetically) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {lvl.arms.map((cls, i) => {
                        const resolvedTeacherName =
                          cls.teacher ||
                          cls.formTeacherName ||
                          (cls.formTeacher
                            ? teacherMap.get(cls.formTeacher) ||
                              (!isUuid(cls.formTeacher) ? cls.formTeacher : undefined)
                            : undefined) ||
                          classFormTeacherMap.get(cls.id);

                        const resolvedClass: ClassRecord = {
                          ...cls,
                          teacher: resolvedTeacherName,
                          subjects:
                            cls.subjects && cls.subjects.length > 0
                              ? cls.subjects
                              : classSubjectsMap[cls.id] || [],
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
                  </div>
                ))}
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
                    : undefined) ||
                  classFormTeacherMap.get(detailClass.id),
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


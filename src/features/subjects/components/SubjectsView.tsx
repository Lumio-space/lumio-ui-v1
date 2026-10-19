'use client';

/**
 * SubjectsView
 *
 * Migrated from lumio-react src/pages/SubjectsPage.tsx.
 * Provides the complete Subject Management experience:
 *   - School-level stats overview
 *   - School section breakdown quick filters
 *   - Multi-field filtering (search, section, status, sort)
 *   - Section-grouped tabular listing
 *   - Direct creation flow with immediate class assignment
 *   - Deep subject details modal
 *   - Class and Teacher assignment dialogs
 */

import { useMemo, useState, useEffect } from 'react';
import {
  PlusIcon,
  SearchIcon,
  BookOpenIcon,
  LayersIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  RefreshCwIcon,
  Trash2Icon,
  AlertCircleIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { StatCard } from '@/components/shared/StatCard';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from '@/components/shared/Dropdown';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/lib/utils';

import {
  SCHOOL_SECTIONS,
  sectionHasDepartment,
  subjectDepartmentTone,
  subjectNeedsConfig,
} from '../constants';
import {
  useSubjects,
  useUpdateSubject,
  useDeleteSubject,
  useAssignClasses,
  useAssignTeacher,
} from '../hooks';
import { useClasses } from '@/features/classes/hooks';
import type { ClassRecord } from '@/features/classes/types';
import { useTeachers } from '@/features/teachers/hooks';

import { CreateSubjectModal } from './CreateSubjectModal';
import { EditSubjectModal } from './EditSubjectModal';
import { SubjectDetailModal } from './SubjectDetailModal';
import { AssignClassesModal } from './AssignClassesModal';
import { AssignTeacherModal, type TeacherOption } from './AssignTeacherModal';

import type {
  SubjectRecord,
  SubjectOffering,
  SchoolSection,
  SubjectStatus,
} from '../types';

type SortKey = 'name' | 'classes' | 'section';

export function SubjectsView() {
  const { data: subjectsData, isLoading, isError, error, refetch } = useSubjects();
  const { data: classesData, refetch: refetchClasses } = useClasses();
  const { data: teachersData } = useTeachers();

  const subjects = useMemo(() => {
    if (Array.isArray(subjectsData)) return subjectsData;
    if (subjectsData && typeof subjectsData === 'object') {
      const anyData = subjectsData as { data?: unknown; items?: unknown };
      if (Array.isArray(anyData.data)) return anyData.data as SubjectRecord[];
      if (Array.isArray(anyData.items)) return anyData.items as SubjectRecord[];
    }
    return [];
  }, [subjectsData]);

  const classes = useMemo(() => {
    if (Array.isArray(classesData)) return classesData;
    if (classesData && typeof classesData === 'object') {
      const anyData = classesData as { data?: unknown; classes?: unknown; items?: unknown };
      if (Array.isArray(anyData.data)) return anyData.data as ClassRecord[];
      if (Array.isArray(anyData.classes)) return anyData.classes as ClassRecord[];
      if (Array.isArray(anyData.items)) return anyData.items as ClassRecord[];
    }
    return [];
  }, [classesData]);

  // Teachers mapped to TeacherOption shape
  const teachers: TeacherOption[] = useMemo(() => {
    const list = Array.isArray(teachersData)
      ? teachersData
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).data))
      ? (teachersData as any).data
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).teachers))
      ? (teachersData as any).teachers
      : [];
    return list.map((t: any) => ({
      id: t.userId || t.id,
      name: t.name || t.fullName || 'Teacher',
      sections: [],
    }));
  }, [teachersData]);

  // Construct offerings from subjects
  const [localOfferings, setLocalOfferings] = useState<SubjectOffering[]>([]);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [teacherAssignmentError, setTeacherAssignmentError] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // Deletion state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectRecord | null>(null);
  const [deleteSubjectError, setDeleteSubjectError] = useState<string | null>(null);
  const deleteSubjectMutation = useDeleteSubject();

  // Edit subject state
  const [editSubjectTarget, setEditSubjectTarget] = useState<SubjectRecord | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Map teacher assignments from backend teachers data: `${subjectId}-${classId}` -> teacherIds
  const teacherSubjectMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const list: any[] = Array.isArray(teachersData)
      ? teachersData
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).data))
      ? (teachersData as any).data
      : (teachersData && typeof teachersData === 'object' && Array.isArray((teachersData as any).teachers))
      ? (teachersData as any).teachers
      : [];

    list.forEach((t) => {
      const tId = t.userId || t.id;
      if (!tId || !Array.isArray(t.subjects)) return;
      t.subjects.forEach((subj: any) => {
        if (subj.id && subj.classId) {
          const key = `${subj.id}-${subj.classId}`;
          const current = map.get(key) || [];
          if (!current.includes(tId)) {
            current.push(tId);
          }
          map.set(key, current);
        }
      });
    });
    return map;
  }, [teachersData]);

  // Update offerings state when subjectsData or teachersData changes
  const offerings = useMemo(() => {
    const fromSubjects: SubjectOffering[] = [];
    subjects.forEach((s) => {
      if (s.offerings && s.offerings.length > 0) {
        s.offerings.forEach((o) => {
          const key = `${o.subjectId}-${o.classId}`;
          const assigned = teacherSubjectMap.get(key) || [];
          const combined = Array.from(new Set([...o.teacherIds, ...assigned]));
          fromSubjects.push({
            ...o,
            teacherIds: combined,
          });
        });
      } else if (s.classIds && s.classIds.length > 0) {
        s.classIds.forEach((cId) => {
          const key = `${s.id}-${cId}`;
          const assigned = teacherSubjectMap.get(key) || [];
          fromSubjects.push({
            id: `of-${s.id}-${cId}`,
            subjectId: s.id,
            classId: cId,
            teacherIds: assigned,
          });
        });
      }
    });

    if (localOfferings.length === 0) return fromSubjects;

    // Subjects with local updates authoritatively take their offerings from localOfferings
    const localSubjectIds = new Set(localOfferings.map((o) => o.subjectId));
    const keptFromSubjects = fromSubjects.filter((o) => !localSubjectIds.has(o.subjectId));
    return [...keptFromSubjects, ...localOfferings];
  }, [subjects, teacherSubjectMap, localOfferings]);


  // Filters state
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<SchoolSection | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubjectStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  // Dialogs state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailSubject, setDetailSubject] = useState<SubjectRecord | null>(null);
  const [classesForSubject, setClassesForSubject] = useState<SubjectRecord | null>(null);
  const [teacherForOffering, setTeacherForOffering] = useState<{
    subject: SubjectRecord;
    offering: SubjectOffering;
  } | null>(null);

  // Mutations
  const updateSubjectMutation = useUpdateSubject();
  const assignClassesMutation = useAssignClasses();
  const assignTeacherMutation = useAssignTeacher();

  // Overview stats calculation
  const stats = useMemo(() => {
    const bySection = (s: SchoolSection) =>
      subjects.filter((x) => x.section === s).length;
    const configured = subjects.filter((s) => {
      const list = offerings.filter((o) => o.subjectId === s.id);
      return list.length > 0 && list.every((o) => o.teacherIds.length > 0);
    }).length;
    const gaps = offerings.filter((o) => o.teacherIds.length === 0).length;

    return {
      total: subjects.length,
      nursery: bySection('Nursery'),
      primary: bySection('Primary'),
      junior: bySection('Junior Secondary'),
      senior: bySection('Senior Secondary'),
      configured,
      gaps,
      unclassified: subjects.filter(subjectNeedsConfig).length,
    };
  }, [subjects, offerings]);

  // Filtered and sorted subjects list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = subjects.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q);
      const matchSection = sectionFilter === 'all' || s.section === sectionFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQ && matchSection && matchStatus;
    });

    return [...list].sort((a, b) => {
      if (sortKey === 'classes') {
        const aCount = offerings.filter((o) => o.subjectId === a.id).length;
        const bCount = offerings.filter((o) => o.subjectId === b.id).length;
        return bCount - aCount;
      }
      if (sortKey === 'section') {
        return (
          SCHOOL_SECTIONS.indexOf(a.section) - SCHOOL_SECTIONS.indexOf(b.section) ||
          a.name.localeCompare(b.name)
        );
      }
      return a.name.localeCompare(b.name);
    });
  }, [subjects, offerings, query, sectionFilter, statusFilter, sortKey]);

  // Grouped by section preserving filter & sort
  const grouped = useMemo(
    () =>
      SCHOOL_SECTIONS.map((s) => ({
        section: s,
        items: filtered.filter((x) => x.section === s),
      })).filter((g) => g.items.length > 0),
    [filtered]
  );

  // Toggle active/inactive
  function toggleStatus(subject: SubjectRecord) {
    if (updateSubjectMutation.isPending) return;
    setStatusUpdateError(null);
    const nextStatus: SubjectStatus =
      subject.status === 'Active' ? 'Inactive' : 'Active';
    updateSubjectMutation.mutate(
      {
        id: subject.id,
        payload: { status: nextStatus },
      },
      {
        onSuccess: () => {
          setSuccessMessage(`Subject "${subject.name}" status updated to ${nextStatus}.`);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Failed to update subject status.';
          setStatusUpdateError(msg);
        },
      }
    );
  }

  // Save class assignments
  function handleSaveClasses(classIds: string[]) {
    if (!classesForSubject) return;
    const targetSubject = classesForSubject;
    const subjectId = targetSubject.id;
    setAssignmentError(null);

    // Send to API
    assignClassesMutation.mutate(
      { subjectId, classIds },
      {
        onSuccess: () => {
          // Authoritatively update local offerings for this subject
          setLocalOfferings((prev) => {
            const others = prev.filter((o) => o.subjectId !== subjectId);
            const forSubject = classIds.map((id) => {
              const existing = prev.find(
                (o) => o.subjectId === subjectId && o.classId === id
              );
              return (
                existing || {
                  id: `of-${subjectId}-${id}`,
                  subjectId,
                  classId: id,
                  teacherIds: [],
                }
              );
            });
            return [...others, ...forSubject];
          });

          setClassesForSubject(null);
          setSuccessMessage(
            `Successfully assigned ${classIds.length} class${
              classIds.length === 1 ? '' : 'es'
            } to ${targetSubject.name}.`
          );
        },
        onError: (err) => {
          const msg =
            err instanceof Error ? err.message : 'Failed to assign classes to subject.';
          setAssignmentError(msg);
        },
      }
    );
  }


  // Save teacher assignment
  function handleSaveTeacher(offeringId: string, teacherId: string | null) {
    setTeacherAssignmentError(null);

    if (teacherForOffering && teacherId) {
      const targetSubject = teacherForOffering.subject;
      const targetOffering = teacherForOffering.offering;
      const matchedTeacher = teachers.find((t) => t.id === teacherId);
      const teacherName = matchedTeacher?.name || 'Teacher';

      assignTeacherMutation.mutate(
        {
          teacherId,
          classId: targetOffering.classId,
          subjectId: targetSubject.id,
        },
        {
          onSuccess: () => {
            setLocalOfferings((prev) =>
              prev.map((o) =>
                o.id === offeringId ? { ...o, teacherIds: [teacherId] } : o
              )
            );
            setTeacherForOffering(null);
            setSuccessMessage(`Successfully assigned ${teacherName} to ${targetSubject.name}.`);
          },
          onError: (err) => {
            const msg = err instanceof Error ? err.message : 'Failed to assign teacher to subject.';
            setTeacherAssignmentError(msg);
          },
        }
      );
    } else {
      setLocalOfferings((prev) =>
        prev.map((o) =>
          o.id === offeringId ? { ...o, teacherIds: [] } : o
        )
      );
      setTeacherForOffering(null);
    }
  }

  // Remove offering
  function handleRemoveOffering(offeringId: string) {
    setLocalOfferings((prev) => prev.filter((o) => o.id !== offeringId));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subjects"
        description="Manage the school's subjects, choose which classes offer each one, and assign a teacher to every class offering."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create subject
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Update Error Notification Banner */}
      {statusUpdateError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <span className="font-medium">{statusUpdateError}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusUpdateError(null)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-white p-6" />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <p className="font-semibold text-red-700">
            {error instanceof Error ? error.message : 'Failed to load subjects.'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCwIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total subjects"
              value={stats.total}
              icon={<BookOpenIcon className="h-5 w-5" />}
              tone="indigo"
            />
            <StatCard
              label="Fully configured"
              value={stats.configured}
              icon={<CheckCircle2Icon className="h-5 w-5" />}
              tone="green"
              delay={0.05}
            />
            <StatCard
              label="Offerings without a teacher"
              value={stats.gaps}
              icon={<AlertTriangleIcon className="h-5 w-5" />}
              tone="gold"
              delay={0.1}
            />
            <StatCard
              label="Awaiting classification"
              value={stats.unclassified}
              icon={<LayersIcon className="h-5 w-5" />}
              tone="purple"
              delay={0.15}
            />
          </div>

          {/* School Section Breakdown Bar */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
            <div className="grid grid-cols-2 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {(
                [
                  ['Nursery', stats.nursery],
                  ['Primary', stats.primary],
                  ['Junior Secondary', stats.junior],
                  ['Senior Secondary', stats.senior],
                ] as const
              ).map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setSectionFilter((s) =>
                      s === label ? 'all' : (label as SchoolSection)
                    )
                  }
                  aria-pressed={sectionFilter === label}
                  className={cn(
                    'p-4 text-left transition-colors sm:text-center',
                    sectionFilter === label
                      ? 'bg-purple-50/60 text-purple-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <p className="font-display text-2xl font-extrabold text-current">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Table Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
            {/* Filters Row */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by subject name or code…"
                  aria-label="Search subjects"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <select
                value={sectionFilter}
                onChange={(e) =>
                  setSectionFilter(e.target.value as SchoolSection | 'all')
                }
                aria-label="Filter by school section"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="all">All sections</option>
                {SCHOOL_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as SubjectStatus | 'all')
                }
                aria-label="Filter by status"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort subjects"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="name">Sort: Name</option>
                <option value="section">Sort: Section</option>
                <option value="classes">Sort: Most classes</option>
              </select>
            </div>

            {/* Empty States */}
            {subjects.length === 0 ? (
              <EmptyState
                icon={<BookOpenIcon className="h-7 w-7" />}
                title="No subjects yet"
                description="Create your first subject, then choose the classes that offer it and assign a teacher to each class."
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Create subject
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="h-7 w-7" />}
                title="No subjects match your filters"
                description="Try a different search term, section, or status."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setSectionFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {grouped.map((group) => (
                  <section key={group.section}>
                    <div className="flex items-center gap-2 bg-slate-50/70 px-4 py-2">
                      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {group.section}
                      </h2>
                      <span className="text-xs text-slate-400">
                        {group.items.length} subject
                        {group.items.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <Table>
                      <THead>
                        <tr>
                          <TH>Subject</TH>
                          <TH className="hidden md:table-cell">Classes</TH>
                          <TH className="hidden lg:table-cell">Teachers</TH>
                          <TH>Status</TH>
                          <TH className="text-right">Actions</TH>
                        </tr>
                      </THead>
                      <tbody>
                        {group.items.map((s) => {
                          const subjectOfferings = offerings.filter(
                            (o) => o.subjectId === s.id
                          );
                          const subjectTeachers = teachers.filter((t) =>
                            subjectOfferings.some((o) => o.teacherIds.includes(t.id))
                          );
                          const gaps = subjectOfferings.filter(
                            (o) => o.teacherIds.length === 0
                          ).length;

                          return (
                            <TR key={s.id}>
                              <TD>
                                <button
                                  type="button"
                                  onClick={() => setDetailSubject(s)}
                                  className="flex items-center gap-3 text-left"
                                >
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-display text-xs font-extrabold text-indigo-700">
                                    {s.code}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block font-semibold text-slate-800">
                                      {s.name}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap items-center gap-1">
                                      {s.department ? (
                                        <Badge
                                          tone={subjectDepartmentTone(s.department)}
                                        >
                                          {s.department}
                                        </Badge>
                                      ) : (
                                        sectionHasDepartment(s.section) && (
                                          <Badge tone="gold">
                                            Department not configured
                                          </Badge>
                                        )
                                      )}
                                      {s.type ? (
                                        <Badge tone="slate">{s.type}</Badge>
                                      ) : (
                                        sectionHasDepartment(s.section) && (
                                          <Badge tone="gold">
                                            Subject type not configured
                                          </Badge>
                                        )
                                      )}
                                    </span>
                                  </span>
                                </button>
                              </TD>

                              <TD className="hidden md:table-cell">
                                {subjectOfferings.length === 0 ? (
                                  <span className="text-sm text-slate-400">
                                    No classes
                                  </span>
                                ) : (
                                  <span className="text-sm text-slate-600">
                                    {subjectOfferings.length} class
                                    {subjectOfferings.length === 1 ? '' : 'es'}
                                  </span>
                                )}
                              </TD>

                              <TD className="hidden lg:table-cell">
                                {subjectTeachers.length === 0 ? (
                                  <span className="text-sm text-slate-400">—</span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <span className="flex -space-x-2">
                                      {subjectTeachers.slice(0, 3).map((t) => (
                                        <Avatar
                                          key={t.id}
                                          name={t.name}
                                          size="xs"
                                        />
                                      ))}
                                    </span>
                                    {subjectTeachers.length > 3 && (
                                      <span className="text-xs text-slate-400">
                                        +{subjectTeachers.length - 3}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </TD>

                              <TD>
                                <div className="flex flex-col items-start gap-1">
                                  <Badge
                                    tone={s.status === 'Active' ? 'green' : 'slate'}
                                    dot
                                  >
                                    {s.status}
                                  </Badge>
                                  {gaps > 0 && (
                                    <span className="text-xs font-medium text-gold-600">
                                      {gaps} without a teacher
                                    </span>
                                  )}
                                  {subjectOfferings.length === 0 &&
                                    s.status === 'Active' && (
                                      <span className="text-xs text-slate-400">
                                        Not offered yet
                                      </span>
                                    )}
                                </div>
                              </TD>

                              <TD>
                                <div className="flex justify-end">
                                  <Dropdown
                                    trigger={
                                      <span
                                        aria-label={`Actions for ${s.name}`}
                                        className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                      >
                                        <MoreVerticalIcon className="h-4 w-4" />
                                      </span>
                                    }
                                  >
                                    <DropdownItem
                                      icon={<EyeIcon className="h-4 w-4" />}
                                      onClick={() => setDetailSubject(s)}
                                    >
                                      View subject
                                    </DropdownItem>
                                    <DropdownItem
                                      icon={<LayersIcon className="h-4 w-4" />}
                                      onClick={() => {
                                        refetchClasses();
                                        setClassesForSubject(s);
                                      }}
                                    >
                                      Assign to classes
                                    </DropdownItem>
                                    <DropdownItem
                                      icon={<PencilIcon className="h-4 w-4" />}
                                      onClick={() => setEditSubjectTarget(s)}
                                    >
                                      Edit subject
                                    </DropdownItem>
                                    <DropdownDivider />
                                    <DropdownItem
                                      icon={<PowerIcon className="h-4 w-4" />}
                                      onClick={() => toggleStatus(s)}
                                    >
                                      {s.status === 'Active'
                                        ? 'Mark inactive'
                                        : 'Mark active'}
                                    </DropdownItem>
                                    <DropdownDivider />
                                    <DropdownItem
                                      danger
                                      icon={<Trash2Icon className="h-4 w-4" />}
                                      onClick={() => {
                                        setDeleteSubjectError(null);
                                        setSubjectToDelete(s);
                                      }}
                                    >
                                      Delete subject
                                    </DropdownItem>
                                  </Dropdown>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </tbody>
                    </Table>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Create Subject Modal ── */}
      <CreateSubjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          setSuccessMessage(`Subject "${created.name}" created successfully.`);
          // Requirement: Create subject -> Subject is created only -> Subject assignment step remains active -> User selects classes -> User explicitly assigns
          refetchClasses();
          setClassesForSubject({ ...created, classIds: [] });
        }}
      />

      {/* ── Edit Subject Modal ── */}
      <EditSubjectModal
        open={!!editSubjectTarget}
        subject={editSubjectTarget}
        onClose={() => setEditSubjectTarget(null)}
        onUpdated={(updated) => {
          setEditSubjectTarget(null);
          setSuccessMessage(`Subject "${updated.name}" updated successfully.`);
        }}
      />

      {/* ── Subject Detail Modal ── */}
      <SubjectDetailModal
        subject={detailSubject}
        offerings={offerings}
        classes={classes}
        teachers={teachers}
        onClose={() => setDetailSubject(null)}
        onEdit={(s) => setEditSubjectTarget(s)}
        onAssignClasses={() => {
          if (detailSubject) {
            refetchClasses();
            setClassesForSubject(detailSubject);
          }
        }}
        onAssignTeacher={(offering) => {
          if (detailSubject) {
            setTeacherForOffering({ subject: detailSubject, offering });
          }
        }}
        onRemoveOffering={handleRemoveOffering}
        onDelete={(s) => {
          setDeleteSubjectError(null);
          setSubjectToDelete(s);
        }}
      />

      {/* ── Assign Classes Modal ── */}
      <AssignClassesModal
        open={!!classesForSubject}
        onClose={() => {
          setClassesForSubject(null);
          setAssignmentError(null);
        }}
        subject={classesForSubject}
        classes={classes}
        offerings={offerings}
        onSave={handleSaveClasses}
        isSaving={assignClassesMutation.isPending}
        errorMessage={assignmentError}
      />

      {/* ── Assign Teacher Modal ── */}
      <AssignTeacherModal
        open={!!teacherForOffering}
        onClose={() => {
          setTeacherForOffering(null);
          setTeacherAssignmentError(null);
        }}
        subject={teacherForOffering?.subject ?? null}
        offering={teacherForOffering?.offering ?? null}
        allOfferings={offerings}
        classes={classes}
        teachers={teachers}
        onSave={handleSaveTeacher}
        isSaving={assignTeacherMutation.isPending}
        errorMessage={teacherAssignmentError}
      />

      {/* ── Delete Subject Confirmation Modal ── */}
      <Modal
        open={!!subjectToDelete}
        onClose={() => {
          if (!deleteSubjectMutation.isPending) {
            setSubjectToDelete(null);
            setDeleteSubjectError(null);
          }
        }}
        title="Delete subject"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setSubjectToDelete(null);
                setDeleteSubjectError(null);
              }}
              disabled={deleteSubjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteSubjectMutation.isPending}
              disabled={deleteSubjectMutation.isPending}
              onClick={() => {
                if (!subjectToDelete) return;
                setDeleteSubjectError(null);
                deleteSubjectMutation.mutate(subjectToDelete.id, {
                  onSuccess: () => {
                    const name = subjectToDelete.name;
                    setSubjectToDelete(null);
                    setSuccessMessage(`Subject "${name}" was successfully deleted.`);
                  },
                  onError: (err) => {
                    const msg = err instanceof Error ? err.message : 'Failed to delete subject.';
                    setDeleteSubjectError(msg);
                  },
                });
              }}
            >
              Delete subject
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {deleteSubjectError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{deleteSubjectError}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <strong className="font-semibold text-slate-900">
              {subjectToDelete?.name} ({subjectToDelete?.code})
            </strong>
            ? This will remove the subject and all its assigned class offerings.
          </p>
        </div>
      </Modal>
    </div>
  );
}


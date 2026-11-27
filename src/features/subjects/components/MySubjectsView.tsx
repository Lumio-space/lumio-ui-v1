'use client';

/**
 * MySubjectsView
 *
 * Teacher-scoped subjects view and subject allocation drill-down.
 * Migrated from lumio-react/src/pages/MySubjectsPage.tsx.
 *
 * Scopes subjects strictly to assignments granted to the authenticated teacher.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  SearchIcon,
  LayersIcon,
  ChevronLeftIcon,
  LockIcon,
  UsersIcon,
  ArrowRightIcon,
  MapPinIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubjects } from '@/features/subjects/hooks';
import { useClasses } from '@/features/classes/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { TeachingContextModal } from '@/features/classes/components/TeachingContextModal';
import {
  composeClassName,
  GRADE_LEVEL_LABELS,
  extractActiveClasses,
  sortClassesSerially,
} from '@/features/classes/constants';
import { isPermissionError, getApiErrorMessage } from '@/lib/api/error';
import type { SubjectRecord } from '@/features/subjects/types';
import type { ClassRecord } from '@/features/classes/types';

export function MySubjectsView() {
  const user = useAuthStore((s) => s.user);
  const {
    data: rawSubjects = [],
    isLoading: subjectsLoading,
    error,
    refetch: refetchSubjects,
  } = useSubjects();
  const {
    data: rawClasses = [],
    isLoading: classesLoading,
    error: classesError,
  } = useClasses();

  const subjects: SubjectRecord[] = useMemo(() => {
    if (Array.isArray(rawSubjects)) return rawSubjects;
    return (rawSubjects as any)?.data || (rawSubjects as any)?.subjects || [];
  }, [rawSubjects]);

  const classes: ClassRecord[] = useMemo(() => {
    return sortClassesSerially(extractActiveClasses<ClassRecord>(rawClasses));
  }, [rawClasses]);

  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [openSubject, setOpenSubject] = useState<SubjectRecord | null>(null);
  const [selectedContext, setSelectedContext] = useState<{
    subject: SubjectRecord;
    classRecord: ClassRecord;
  } | null>(null);

  // Filter subjects assigned to this teacher (explicit offerings only)
  const mySubjects = useMemo(() => {
    if (!user) return [];
    return subjects.filter((s: SubjectRecord) =>
      Boolean(
        s.offerings?.some((o) =>
          Boolean(user.id && o.teacherIds?.includes(user.id))
        )
      )
    );
  }, [subjects, user]);

  // Find classes where teacher teaches the openSubject (explicit offerings only)
  const classesForOpenSubject = useMemo(() => {
    if (!openSubject || !user) return [];
    const matched = classes.filter((c: ClassRecord) =>
      Boolean(
        openSubject.offerings?.some(
          (o) =>
            o.classId === c.id &&
            Boolean(user.id && o.teacherIds?.includes(user.id))
        )
      )
    );
    return sortClassesSerially(matched);
  }, [classes, openSubject, user]);

  const totalStudentsInOpenSubject = useMemo(() => {
    return classesForOpenSubject.reduce((acc, c) => acc + (c.students ?? 0), 0);
  }, [classesForOpenSubject]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mySubjects.filter((s: SubjectRecord) => {
      const matchQ =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.section?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q);

      const matchSection =
        sectionFilter === 'all' ||
        s.section?.toLowerCase() === sectionFilter.toLowerCase();

      return matchQ && matchSection;
    });
  }, [mySubjects, query, sectionFilter]);

  if (subjectsLoading || classesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Subjects"
          description="Subjects assigned to your teaching workload"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  /* ------------------- Subject Drill-Down View (lumio-react) ------------------- */
  if (openSubject) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setOpenSubject(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-800"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to My Subjects
        </button>

        <PageHeader
          title={openSubject.name}
          description="Classes you teach this subject in. Other classes taking this subject are not in your workload."
        />

        {/* Subject Overview Card matching lumio-react */}
        <Card className="border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-12 items-center justify-center rounded-lg bg-indigo-50 font-display text-xs font-extrabold text-indigo-700">
              {openSubject.code}
            </span>
            <Badge tone="indigo">{openSubject.section}</Badge>
            {openSubject.department && (
              <Badge tone="purple" dot>
                {openSubject.department}
              </Badge>
            )}
            {openSubject.type && <Badge tone="slate">{openSubject.type}</Badge>}
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <LockIcon className="h-3 w-3" />
              Set by school administrator
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Classes Taught</dt>
              <dd className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                {classesForOpenSubject.length}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Students Taking Subject</dt>
              <dd className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                {totalStudentsInOpenSubject}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Classes Taught in this Subject */}
        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-500">
            Classes You Teach in {openSubject.name} · {classesForOpenSubject.length}
          </h2>

          {classesForOpenSubject.length === 0 ? (
            <Card className="border-slate-100 bg-white p-6 text-center text-xs text-slate-500">
              <LayersIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No specific class allocations active for this subject yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {classesForOpenSubject.map((c, i) => {
                const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                const dept =
                  c.department && c.department !== 'Nill' ? c.department : undefined;
                const className = composeClassName(gradeLabel, dept, c.section);
                const isForm =
                  c.id === user?.classId ||
                  c.formTeacher === user?.name ||
                  c.formTeacher === user?.id;

                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                    onClick={() =>
                      setSelectedContext({
                        subject: openSubject,
                        classRecord: c,
                      })
                    }
                    className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-xs transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="block font-display text-base font-extrabold text-slate-900">
                          {className}
                        </span>
                        {c.room && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <MapPinIcon className="h-3 w-3" />
                            Room {c.room}
                          </span>
                        )}
                      </div>
                      {isForm && (
                        <Badge tone="gold" dot>
                          Form
                        </Badge>
                      )}
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                      <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {c.students ?? 0}
                      </span>{' '}
                      students enrolled
                    </p>

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-indigo-700">
                      Open teaching context
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Teaching Context Modal */}
        {selectedContext && (
          <TeachingContextModal
            open={Boolean(selectedContext)}
            subject={selectedContext.subject}
            classRecord={selectedContext.classRecord}
            currentTeacherName={user?.name ?? 'Teacher'}
            isFormTeacher={
              selectedContext.classRecord.id === user?.classId ||
              selectedContext.classRecord.formTeacher === user?.name ||
              selectedContext.classRecord.formTeacher === user?.id
            }
            onClose={() => setSelectedContext(null)}
          />
        )}
      </div>
    );
  }

  /* ------------------- Subjects List View ------------------- */
  const isSubjectsForbidden = isPermissionError(error);
  const isClassesForbidden = isPermissionError(classesError);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subjects"
        description={`The subjects ${user?.name ?? 'you'} are assigned to teach. Set by your school administrator.`}
      />

      {error ? (
        <Card className={isSubjectsForbidden ? 'border-amber-200 bg-amber-50/70' : 'border-rose-200 bg-rose-50'}>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                isSubjectsForbidden ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <LockIcon className="h-6 w-6" />
            </div>
            <h3 className={`font-display text-base font-bold ${isSubjectsForbidden ? 'text-amber-950' : 'text-rose-900'}`}>
              {isSubjectsForbidden
                ? 'Assigned Subjects Unavailable'
                : 'Unable to Load Assigned Subjects'}
            </h3>
            <p className={`mt-1 max-w-md text-xs leading-relaxed ${isSubjectsForbidden ? 'text-amber-800' : 'text-rose-700'}`}>
              {isSubjectsForbidden
                ? 'Your teacher account does not currently have permission to access the school subjects directory. A dedicated teacher-scoped endpoint is required from the backend.'
                : getApiErrorMessage(error, 'Failed to load assigned subjects. Please try again.')}
            </p>
            {!isSubjectsForbidden && refetchSubjects && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchSubjects()}
                className="mt-4"
              >
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {classesError && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
            >
              {isClassesForbidden
                ? 'Class details could not be loaded because your role lacks access to the classes directory.'
                : `Unable to load class details: ${getApiErrorMessage(classesError, 'Request failed.')}`}
            </div>
          )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon={<BookOpenIcon className="h-5 w-5" />}
          tone="indigo"
        />
        <StatCard
          label="Active Allocations"
          value={mySubjects.reduce(
            (acc, s) => acc + (s.classIds?.length ?? 0),
            0
          )}
          icon={<LayersIcon className="h-5 w-5" />}
          tone="purple"
          delay={0.05}
        />
      </div>

      {mySubjects.length === 0 ? (
        <Card className="border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-4">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No subjects assigned yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Your school administrator will assign subjects and classes to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search my subjects…"
                aria-label="Search my subjects"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              aria-label="Filter by school level"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-w-[140px]"
            >
              <option value="all">All Levels</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Junior Secondary">Junior Secondary</option>
              <option value="Senior Secondary">Senior Secondary</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-slate-100 bg-white">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                No subjects match your filter query.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s: SubjectRecord) => (
                <div
                  key={s.id}
                  onClick={() => setOpenSubject(s)}
                  className="flex flex-col cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-display text-xs font-extrabold text-indigo-700">
                      {s.code}
                    </span>
                    <Badge tone="indigo">{s.section}</Badge>
                  </div>

                  <h3 className="mt-3 font-display text-base font-extrabold text-slate-900">
                    {s.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.department && (
                      <Badge tone="purple">{s.department}</Badge>
                    )}
                    {s.type && <Badge tone="slate">{s.type}</Badge>}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-50">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <LayersIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{s.classIds?.length ?? 0} classes assigned</span>
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                      View allocations
                      <ArrowRightIcon className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}

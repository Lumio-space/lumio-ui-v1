'use client';

/**
 * MyClassesView
 *
 * Teacher-scoped classes view and class cohort drill-down.
 * Migrated from lumio-react/src/pages/MyClassesPage.tsx.
 *
 * Scopes rosters strictly to assigned classes and restricts parent
 * communication solely to designated Form Teachers.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  SearchIcon,
  MapPinIcon,
  LayersIcon,
  ChevronLeftIcon,
  LockIcon,
  ArrowRightIcon,
  CalendarCheckIcon,
  BookOpenIcon,
  MessageSquareIcon,
  UserIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import { useStudents } from '@/features/students/hooks';
import { useAuthStore } from '@/stores/auth.store';
import {
  composeClassName,
  GRADE_LEVEL_LABELS,
  extractActiveClasses,
  sortClassesSerially,
} from '@/features/classes/constants';
import { isPermissionError, getApiErrorMessage } from '@/lib/api/error';
import { TeachingContextModal } from './TeachingContextModal';
import { MessageParentModal } from '@/features/parents/components/MessageParentModal';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';
import type { StudentRecord } from '@/features/students/types';

function isUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function MyClassesView() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId');

  const {
    data: rawClasses = [],
    isLoading: classesLoading,
    error,
    refetch: refetchClasses,
  } = useClasses();
  const {
    data: rawSubjects = [],
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();

  const classes: ClassRecord[] = useMemo(() => {
    return sortClassesSerially(extractActiveClasses<ClassRecord>(rawClasses));
  }, [rawClasses]);

  const subjects: SubjectRecord[] = useMemo(() => {
    if (Array.isArray(rawSubjects)) return rawSubjects;
    return (rawSubjects as any)?.data || (rawSubjects as any)?.subjects || [];
  }, [rawSubjects]);

  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const userId = user?.id;
  const userTeacherId = user?.teacherId;
  const userName = user?.name;
  const userFullName = user?.fullName;

  const teacherIds = useMemo(() => {
    const ids = new Set<string>();
    if (userId) ids.add(userId);
    if (userTeacherId) ids.add(userTeacherId);
    return ids;
  }, [userId, userTeacherId]);

  const teacherNames = useMemo(() => {
    const names = new Set<string>();
    if (userName) names.add(userName);
    if (userFullName) names.add(userFullName);
    return names;
  }, [userName, userFullName]);

  // Filter classes assigned to the authenticated teacher (without fabricating classes)
  const myClasses = useMemo(() => {
    if (!user) return [];
    const matched = classes.filter((c: ClassRecord) => {
      const matchesDirectClass = Boolean(user.classId && c.id === user.classId);
      const matchesFormTeacherId = Boolean(c.formTeacher && teacherIds.has(c.formTeacher));
      const matchesFormTeacherName = Boolean(
        (c.formTeacher && teacherNames.has(c.formTeacher)) ||
        (c.formTeacherName && teacherNames.has(c.formTeacherName))
      );
      const matchesTeacherId = Boolean(c.teacher && teacherIds.has(c.teacher));
      const matchesTeacherName = Boolean(c.teacher && teacherNames.has(c.teacher));
      const matchesSubjectOffering = subjects.some((s) =>
        s.offerings?.some(
          (o) =>
            o.classId === c.id &&
            o.teacherIds?.some((tid) => teacherIds.has(tid))
        )
      );

      return (
        matchesDirectClass ||
        matchesFormTeacherId ||
        matchesFormTeacherName ||
        matchesTeacherId ||
        matchesTeacherName ||
        matchesSubjectOffering
      );
    });
    return sortClassesSerially(matched);
  }, [classes, subjects, user, teacherIds, teacherNames]);

  const [openClass, setOpenClass] = useState<ClassRecord | null>(() => {
    if (initialClassId) {
      return myClasses.find((c) => c.id === initialClassId) ?? null;
    }
    return null;
  });

  useEffect(() => {
    if (initialClassId && !openClass && myClasses.length > 0) {
      const target = myClasses.find((c) => c.id === initialClassId);
      if (target) setOpenClass(target);
    }
  }, [initialClassId, openClass, myClasses]);

  const [selectedContext, setSelectedContext] = useState<{
    subject: SubjectRecord;
    classRecord: ClassRecord;
  } | null>(null);

  const [messagingStudent, setMessagingStudent] = useState<StudentRecord | null>(null);

  // Roster for selected open class
  const { data: classStudentsResponse, isLoading: studentsLoading } = useStudents(
    openClass ? { classId: openClass.id } : undefined
  );
  const classStudents = classStudentsResponse?.data || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myClasses.filter((c: ClassRecord) => {
      const matchQ =
        !q ||
        c.grade?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        c.level?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q);

      const matchSection =
        sectionFilter === 'all' ||
        c.level?.toLowerCase() === sectionFilter.toLowerCase();

      return matchQ && matchSection;
    });
  }, [myClasses, query, sectionFilter]);

  // Subjects taught by current teacher in openClass (explicit offerings only)
  const mySubjectsInOpenClass = useMemo(() => {
    if (!openClass || !user) return [];
    return subjects.filter((s) =>
      Boolean(
        s.offerings?.some(
          (o) =>
            o.classId === openClass.id &&
            Boolean(user.id && o.teacherIds?.includes(user.id))
        )
      )
    );
  }, [openClass, subjects, user]);

  if (classesLoading || subjectsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Classes"
          description="Classes assigned to your teaching schedule"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  /* ------------------- Class Drill-Down View (lumio-react) ------------------- */
  if (openClass) {
    const isFormTeacher =
      openClass.id === user?.classId ||
      Boolean(openClass.formTeacher && (teacherIds.has(openClass.formTeacher) || teacherNames.has(openClass.formTeacher))) ||
      Boolean(openClass.formTeacherName && teacherNames.has(openClass.formTeacherName));

    const formTeacherDisplayName =
      openClass.formTeacherName ||
      openClass.teacher ||
      (openClass.formTeacher && !isUuid(openClass.formTeacher)
        ? openClass.formTeacher
        : openClass.formTeacher
        ? 'Assigned'
        : undefined);

    const gradeLabel = GRADE_LEVEL_LABELS[openClass.grade] ?? openClass.grade;
    const dept =
      openClass.department && openClass.department !== 'Nill'
        ? openClass.department
        : undefined;
    const fullClassName = composeClassName(gradeLabel, dept, openClass.section);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setOpenClass(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-800"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to My Classes
        </button>

        <PageHeader
          title={fullClassName}
          description="Your teaching assignment and student cohort in this class."
          actions={
            isFormTeacher ? (
              <Link href={`/attendance?classId=${openClass.id}`}>
                <Button
                  leftIcon={<CalendarCheckIcon className="h-4 w-4" />}
                  className="bg-gold-400 text-indigo-950 font-bold hover:bg-gold-300"
                >
                  Mark Daily Register
                </Button>
              </Link>
            ) : null
          }
        />

        {/* Class Overview Card matching lumio-react */}
        <Card className="border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="indigo">{openClass.level}</Badge>
            {dept && (
              <Badge tone="purple" dot>
                {dept}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <LockIcon className="h-3 w-3" />
              Set by school administrator
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Enrolled Students</dt>
              <dd className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                {classStudents.length || openClass.students || 0}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">My Subjects Here</dt>
              <dd className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                {mySubjectsInOpenClass.length}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Room Location</dt>
              <dd className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-slate-700">
                <MapPinIcon className="h-4 w-4 text-slate-400" />
                {openClass.room ? `Room ${openClass.room}` : 'Main Classroom'}
              </dd>
            </div>
          </dl>

          {/* Form Teacher Pastoral Banner */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Form Teacher:
            </span>
            {formTeacherDisplayName ? (
              <span className="flex items-center gap-2">
                <Avatar name={formTeacherDisplayName} size="xs" />
                <span className="text-xs font-semibold text-slate-800">
                  {formTeacherDisplayName}
                </span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">Not assigned</span>
            )}
            {isFormTeacher && (
              <Badge tone="gold" dot>
                That&rsquo;s you
              </Badge>
            )}
          </div>
        </Card>

        {/* My Subjects in this Class */}
        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-500">
            My Subjects in this Class · {mySubjectsInOpenClass.length}
          </h2>

          {mySubjectsInOpenClass.length === 0 ? (
            <Card className="border-slate-100 bg-white p-6 text-center text-xs text-slate-500">
              <BookOpenIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No specific subjects assigned to your schedule for this class yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mySubjectsInOpenClass.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                  onClick={() =>
                    setSelectedContext({ subject: s, classRecord: openClass })
                  }
                  className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-xs transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-display text-xs font-extrabold text-indigo-700">
                      {s.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-extrabold text-slate-900">
                        {s.name}
                      </span>
                      {s.type && (
                        <span className="mt-1 inline-flex">
                          <Badge tone="slate">{s.type}</Badge>
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                    <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {classStudents.length || openClass.students || 0}
                    </span>{' '}
                    students
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-purple-600">
                    Open subject context
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Class Student Roster Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500">
              Student Register ({classStudents.length || openClass.students || 0})
            </h2>
            {isFormTeacher && (
              <Badge tone="gold" dot>
                Form Teacher Pastoral Lead
              </Badge>
            )}
          </div>

          {studentsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading student roster…
            </div>
          ) : classStudents.length === 0 ? (
            <Card className="border-slate-100 bg-white p-8 text-center text-xs text-slate-500">
              No students enrolled in this register yet.
            </Card>
          ) : (
            <Card className="border-slate-100 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student Name</th>
                      <th className="px-4 py-3 font-semibold">Admission No</th>
                      <th className="px-4 py-3 font-semibold">Attendance</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      {isFormTeacher && (
                        <th className="px-4 py-3 text-right font-semibold">
                          Pastoral Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={st.name || st.fullName} size="xs" />
                            <span className="font-semibold text-slate-800">
                              {st.name || st.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {st.admissionNo}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {st.attendance ?? 92}%
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={st.status === 'Active' ? 'green' : 'slate'}>
                            {st.status}
                          </Badge>
                        </td>
                        {isFormTeacher && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMessagingStudent(st)}
                              leftIcon={<MessageSquareIcon className="h-3.5 w-3.5" />}
                              className="text-xs text-purple-700 hover:text-purple-900"
                            >
                              Message Parent
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Teaching Context Modal */}
        {selectedContext && (
          <TeachingContextModal
            open={Boolean(selectedContext)}
            subject={selectedContext.subject}
            classRecord={selectedContext.classRecord}
            currentTeacherName={user?.name ?? 'Teacher'}
            isFormTeacher={isFormTeacher}
            onClose={() => setSelectedContext(null)}
          />
        )}

        {/* Form Teacher Parent Messaging Modal */}
        {messagingStudent && (
          <MessageParentModal
            open={Boolean(messagingStudent)}
            parentName={messagingStudent.parent || `Parent of ${messagingStudent.name}`}
            studentName={messagingStudent.name || messagingStudent.fullName}
            parentEmail={messagingStudent.parentEmail}
            onClose={() => setMessagingStudent(null)}
          />
        )}
      </div>
    );
  }

  /* ------------------- Class List View ------------------- */
  const isClassesForbidden = isPermissionError(error);
  const isSubjectsForbidden = isPermissionError(subjectsError);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description={`The classes ${user?.name ?? 'you'} teach in. Access is granted per assigned class.`}
      />

      {error ? (
        <Card className={isClassesForbidden ? 'border-amber-200 bg-amber-50/70' : 'border-rose-200 bg-rose-50'}>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                isClassesForbidden ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <LockIcon className="h-6 w-6" />
            </div>
            <h3 className={`font-display text-base font-bold ${isClassesForbidden ? 'text-amber-950' : 'text-rose-900'}`}>
              {isClassesForbidden
                ? 'Teaching Classes Unavailable'
                : 'Failed to load classes'}
            </h3>
            <p className={`mt-1 max-w-md text-xs leading-relaxed ${isClassesForbidden ? 'text-amber-800' : 'text-rose-700'}`}>
              {isClassesForbidden
                ? 'Your teacher account does not currently have permission to access the school class directory. A dedicated teacher-scoped classes endpoint is required from the backend to display all your form and subject-teaching classes.'
                : getApiErrorMessage(error, 'Failed to load assigned classes. Please try again.')}
            </p>
            {!isClassesForbidden && refetchClasses && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchClasses()}
                className="mt-4"
              >
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {subjectsError && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
            >
              {isSubjectsForbidden
                ? 'Subject-teaching assignments could not be loaded because your role lacks access to the subjects directory. Only form-teacher classes returned by the classes API can be shown.'
                : `Unable to load subject assignments: ${getApiErrorMessage(subjectsError, 'Request failed.')}`}
            </div>
          )}

          {myClasses.length === 0 ? (
        <Card className="border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-4">
              <LayersIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No classes assigned yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Your school administrator will assign classes and subjects to you.
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
                placeholder="Search my classes…"
                aria-label="Search my classes"
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
              <option value="nursery">Nursery</option>
              <option value="primary">Primary</option>
              <option value="junior_secondary">Junior Secondary</option>
              <option value="senior_secondary">Senior Secondary</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-slate-100 bg-white">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                No classes match your filter criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c: ClassRecord) => {
                const isForm =
                  c.id === user?.classId ||
                  c.formTeacher === user?.name ||
                  c.formTeacher === user?.id;

                const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                const dept =
                  c.department && c.department !== 'Nill'
                    ? c.department
                    : undefined;
                const fullClassName = composeClassName(gradeLabel, dept, c.section);

                return (
                  <div
                    key={c.id}
                    onClick={() => setOpenClass(c)}
                    className="flex flex-col cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-base font-extrabold text-slate-900">
                          {fullClassName}
                        </p>
                        {c.room && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <MapPinIcon className="h-3 w-3" />
                            Room {c.room}
                          </p>
                        )}
                      </div>
                      {isForm && (
                        <Badge tone="gold" dot>
                          Form teacher
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone="indigo">{c.level}</Badge>
                      {dept && <Badge tone="purple">{dept}</Badge>}
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-50">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {c.students ?? 0}
                        </span>{' '}
                        students
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        View class
                        <ArrowRightIcon className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}

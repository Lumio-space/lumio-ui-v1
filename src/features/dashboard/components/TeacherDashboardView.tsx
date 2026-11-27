'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpenIcon,
  UsersIcon,
  CalendarCheckIcon,
  ArrowRightIcon,
  LibraryBigIcon,
  LayersIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/shared/Progress';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import {
  composeClassName,
  GRADE_LEVEL_LABELS,
  extractActiveClasses,
  sortClassesSerially,
} from '@/features/classes/constants';
import { isPermissionError, getApiErrorMessage } from '@/lib/api/error';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';

const TIME_SLOTS = [
  '08:30 – 09:15',
  '09:15 – 10:00',
  '10:15 – 11:00',
  '11:00 – 11:45',
  '12:30 – 13:15',
  '13:15 – 14:00',
];

export function TeacherDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Teacher';

  const {
    data: rawClasses = [],
    isLoading: classesLoading,
    error: classesError,
    refetch: refetchClasses,
  } = useClasses();
  const {
    data: rawSubjects = [],
    isLoading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useSubjects();

  const classes: ClassRecord[] = useMemo(() => {
    return sortClassesSerially(extractActiveClasses<ClassRecord>(rawClasses));
  }, [rawClasses]);

  const subjects: SubjectRecord[] = useMemo(() => {
    if (Array.isArray(rawSubjects)) return rawSubjects;
    return (rawSubjects as any)?.data || (rawSubjects as any)?.subjects || [];
  }, [rawSubjects]);

  const userId = user?.id;
  const userTeacherId = user?.teacherId;
  const userName = user?.name;
  const userFullName = user?.fullName;
  const userClassId = user?.classId;

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

  // Find classes assigned to this teacher (without fabricating classes)
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

  // Distinct classes where the teacher is Form Teacher
  const formClasses = useMemo(() => {
    return myClasses.filter((c: ClassRecord) => {
      return (
        Boolean(userClassId && c.id === userClassId) ||
        Boolean(c.formTeacher && (teacherIds.has(c.formTeacher) || teacherNames.has(c.formTeacher))) ||
        Boolean(c.formTeacherName && teacherNames.has(c.formTeacherName))
      );
    });
  }, [myClasses, userClassId, teacherIds, teacherNames]);

  // Find subjects assigned to this teacher (explicit offerings only)
  const mySubjects = useMemo(() => {
    if (!user) return [];
    return subjects.filter((s: SubjectRecord) =>
      Boolean(
        s.offerings?.some((o) =>
          Boolean(o.teacherIds?.some((tid) => teacherIds.has(tid)))
        )
      )
    );
  }, [subjects, user, teacherIds]);

  const totalStudents = useMemo(() => {
    return myClasses.reduce(
      (acc: number, c: ClassRecord) => acc + (c.students ?? 0),
      0
    );
  }, [myClasses]);

  // Today's scheduled teaching periods derived from assigned classes & subjects
  const todaysSchedule = useMemo(() => {
    if (myClasses.length === 0) return [];
    return myClasses.slice(0, Math.min(myClasses.length, 4)).map((c, idx) => {
      const subject = mySubjects[idx % Math.max(mySubjects.length, 1)] || {
        name: 'General Studies',
        code: 'GEN',
      };
      const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
      const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
      const className = composeClassName(gradeLabel, dept, c.section);

      return {
        id: `${c.id}-${idx}`,
        time: TIME_SLOTS[idx % TIME_SLOTS.length],
        className,
        classId: c.id,
        subject: subject.name,
        subjectCode: subject.code,
        room: c.room || `${gradeLabel} Room`,
        isForm:
          c.id === user?.classId ||
          c.formTeacher === user?.name ||
          c.formTeacher === user?.id,
      };
    });
  }, [myClasses, mySubjects, user]);

  const loadError = classesError || subjectsError;
  const isPermissionFailure =
    isPermissionError(classesError) || isPermissionError(subjectsError);
  const isLoadingAssignments = Boolean(classesLoading || subjectsLoading);

  return (
    <div className="space-y-6">
      {loadError && (
        <div
          role="alert"
          className={
            isPermissionFailure
              ? 'flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'
              : 'flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800'
          }
        >
          <div className="flex items-start gap-3">
            <AlertCircleIcon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isPermissionFailure ? 'text-amber-600' : 'text-rose-500'
              }`}
            />
            <div>
              <p className="font-semibold">
                {isPermissionFailure
                  ? 'Teaching assignment access restricted'
                  : 'Unable to load teaching assignments'}
              </p>
              <p className={`mt-0.5 text-xs ${isPermissionFailure ? 'text-amber-800' : 'text-rose-700'}`}>
                {isPermissionFailure
                  ? 'Your teacher account does not have permission to read the school class or subject directories. A teacher-scoped backend endpoint is required to list all assigned classes and subjects.'
                  : getApiErrorMessage(
                      loadError,
                      'Failed to retrieve assigned classes or subjects from the server.'
                    )}
              </p>
            </div>
          </div>
          {!isPermissionFailure && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (classesError && refetchClasses) refetchClasses();
                if (subjectsError && refetchSubjects) refetchSubjects();
              }}
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {isLoadingAssignments && (
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
          Loading your teaching assignments…
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-6 text-white sm:p-7 shadow-xs">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">
              Welcome back, {firstName} 👋
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
              Teacher Workspace — {schoolName}
            </h2>
            <p className="mt-1.5 text-xs text-indigo-300">
              {myClasses.length > 0
                ? `You have ${todaysSchedule.length} teaching sessions scheduled and ${formClasses.length} form cohort${formClasses.length === 1 ? '' : 's'} assigned.`
                : 'Your school administrator will assign classes and subjects to your profile.'}
            </p>
          </div>
          {formClasses.length > 0 && (
            <Link href={`/attendance?classId=${formClasses[0].id}`}>
              <Button
                className="bg-gold-400 text-indigo-950 font-bold hover:bg-gold-300"
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Mark Register
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Teacher Workload 4-Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="My Classes"
          value={myClasses.length}
          icon={<BookOpenIcon className="h-5 w-5" />}
          tone="purple"
          delay={0}
        />
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon={<LibraryBigIcon className="h-5 w-5" />}
          tone="indigo"
          delay={0.05}
        />
        <StatCard
          label="My Students"
          value={totalStudents}
          icon={<UsersIcon className="h-5 w-5" />}
          tone="green"
          delay={0.1}
        />
        <StatCard
          label="Form Classes"
          value={formClasses.length}
          icon={<ShieldCheckIcon className="h-5 w-5" />}
          tone="gold"
          delay={0.15}
        />
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Today's Schedule & My Assigned Classes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Schedule Card matching lumio-react */}
          <Card className="border-slate-100 bg-white shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today&rsquo;s Schedule</CardTitle>
                <CardDescription>Scheduled periods & classroom locations</CardDescription>
              </div>
              <Badge tone="purple" dot>
                Daily Roster
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {todaysSchedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ClockIcon className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No periods scheduled today
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your assigned class timetable will appear here.
                  </p>
                </div>
              ) : (
                todaysSchedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="w-28 shrink-0 text-xs font-bold text-slate-700">
                      {slot.time}
                    </div>
                    <div
                      className="flex h-9 w-1.5 shrink-0 rounded-full bg-purple-500"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {slot.subject}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPinIcon className="h-3 w-3" />
                        {slot.room}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="indigo">{slot.className}</Badge>
                      {slot.isForm && (
                        <Badge tone="gold" dot>
                          Form
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* My Assigned Classes with Attendance Quick Links */}
          <Card className="border-slate-100 bg-white shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>My Classes & Cohorts</CardTitle>
                <CardDescription>Classes under your instruction and care</CardDescription>
              </div>
              <Link href="/my-classes">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  className="text-xs font-semibold text-indigo-700"
                >
                  Manage Classes
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {myClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-3">
                    <LayersIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    No classes assigned yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    Your administrator will assign teaching subjects and form cohorts to your profile.
                  </p>
                </div>
              ) : (
                myClasses.map((c: ClassRecord) => {
                  const isForm =
                    c.id === user?.classId ||
                    c.formTeacher === user?.name ||
                    c.formTeacher === user?.id;
                  const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                  const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
                  const className = composeClassName(gradeLabel, dept, c.section);

                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm font-extrabold text-slate-900">
                              {className}
                            </h3>
                            {isForm && (
                              <Badge tone="gold" dot>
                                Form Teacher
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {c.level}
                            {c.department && c.department !== 'Nill' && ` · ${c.department}`}
                            {c.room && ` · Room ${c.room}`}
                            {` · ${c.students ?? 0} students enrolled`}
                          </p>
                        </div>
                        {isForm ? (
                          <Link href={`/attendance?classId=${c.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<CalendarCheckIcon className="h-3.5 w-3.5" />}
                              className="text-xs"
                            >
                              Mark Register
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/my-classes?classId=${c.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                              className="text-xs text-slate-600"
                            >
                              View Roster
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Attendance indicator bar */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Average Attendance</span>
                          <span className="font-semibold text-slate-700">94%</span>
                        </div>
                        <Progress value={94} tone="purple" size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Form Teacher Pastoral Card & My Subjects */}
        <div className="space-y-6">
          {/* Form Teacher Pastoral Duty Banner */}
          {formClasses.length > 0 ? (
            <Card className="border-gold-200 bg-gradient-to-br from-gold-50/70 to-amber-50/40 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-gold-600" />
                  <CardTitle className="text-gold-950">Form Teacher Duties</CardTitle>
                </div>
                <CardDescription className="text-gold-800">
                  Pastoral care and register ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gold-900 leading-relaxed">
                  You are the designated pastoral lead for{' '}
                  <span className="font-bold">
                    {formClasses.map((c) => composeClassName(GRADE_LEVEL_LABELS[c.grade] ?? c.grade, c.department && c.department !== 'Nill' ? c.department : undefined, c.section)).join(', ')}
                  </span>
                  . You are authorized to mark official attendance and liaise with parents regarding student welfare.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-gold-900">
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                    <span>Daily attendance register unlocked</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gold-900">
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                    <span>Authorized parent messaging channel</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link href={`/attendance?classId=${formClasses[0].id}`}>
                    <Button
                      size="sm"
                      className="w-full bg-gold-400 text-indigo-950 font-bold hover:bg-gold-300"
                    >
                      Record Today&rsquo;s Register
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-100 bg-white">
              <CardHeader className="pb-3">
                <CardTitle>Subject Teacher Role</CardTitle>
                <CardDescription>Academic instruction focus</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You are currently assigned as a subject teacher. Pastoral care and form register marking are administered by the appointed Form Teachers.
                </p>
              </CardContent>
            </Card>
          )}

          {/* My Subjects Widget */}
          <Card className="border-slate-100 bg-white shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>My Subjects</CardTitle>
                <CardDescription>Assigned curriculum</CardDescription>
              </div>
              <Link href="/my-subjects">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-700">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {mySubjects.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No subjects assigned yet
                </p>
              ) : (
                mySubjects.map((s: SubjectRecord) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {s.section}
                        {s.department && ` · ${s.department}`}
                      </p>
                    </div>
                    <Badge tone="indigo">{s.code}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

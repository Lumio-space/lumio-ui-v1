'use client';

/**
 * Attendance Page — /attendance
 *
 * Full Attendance Register and Tracking View.
 * Matches lumio-react/src/pages/AttendancePage.tsx UI/UX.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import {
  CalendarIcon,
  SchoolIcon,
  AlertCircleIcon,
  LockIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  EyeIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AttendanceArea } from '@/components/charts/Charts';
import { cn } from '@/lib/utils';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import {
  useClassAttendance,
  useSaveAttendance,
  useUpdateAttendance,
  AttendanceSummaryCards,
  AttendanceRoster,
  ParentAttendanceView,
  type ClassAttendanceSummary,
  type AttendanceStatus,
} from '@/features/attendance';
import { useAuthStore } from '@/stores/auth.store';

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const queryClassId = searchParams.get('classId');
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: rawClasses = [], isLoading: classesLoading } = useClasses();
  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Default to query classId, or assigned Form Teacher class for teachers, or first class
  useEffect(() => {
    if (classes.length === 0) return;
    if (queryClassId && classes.some((c) => c.id === queryClassId)) {
      setSelectedClassId(queryClassId);
      return;
    }
    if (!selectedClassId) {
      if (role === 'teacher' && user) {
        const userFullName = (user as any).fullName || user.name;
        const formClass = classes.find(
          (c) =>
            (user.classId && c.id === user.classId) ||
            (user.id && (c.formTeacher === user.id || (c as any).formTeacherId === user.id || (c as any).teacher === user.id)) ||
            (user.name && (c.formTeacher === user.name || c.formTeacherName === user.name || (c as any).teacher === user.name)) ||
            (userFullName && (c.formTeacher === userFullName || c.formTeacherName === userFullName || (c as any).teacher === userFullName))
        );
        if (formClass) {
          setSelectedClassId(formClass.id);
          return;
        }
      }
      setSelectedClassId(classes[0].id);
    }
  }, [classes, queryClassId, role, selectedClassId, user]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  const classNameDisplay = selectedClass ? formatClassName(selectedClass) : 'Class';

  // Attendance query (disabled for parents to prevent unauthorized class roster fetch)
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch,
  } = useClassAttendance(role === 'parent' ? '' : selectedClassId, selectedDate);

  const saveMutation = useSaveAttendance();
  const updateMutation = useUpdateAttendance();

  // Local live summary state
  const [liveSummary, setLiveSummary] = useState<ClassAttendanceSummary>({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  });

  useEffect(() => {
    if (attendanceData?.summary) {
      setLiveSummary(attendanceData.summary);
    }
  }, [attendanceData?.summary]);

  const students = attendanceData?.students || [];

  // Permissions: Only the designated Form Teacher can mark/edit attendance. Admins and non-form staff have view-only access.
  const isFormTeacher = useMemo(() => {
    if (role !== 'teacher' || !user || !selectedClass) return false;
    const userIdLower = user.id ? String(user.id).trim().toLowerCase() : '';
    const userTeacherIdLower = (user as any).teacherId ? String((user as any).teacherId).trim().toLowerCase() : '';
    const userName = user.name || (user as any).fullName || '';
    const userNameLower = userName.trim().toLowerCase();

    const classFormTeacher = selectedClass.formTeacher ? String(selectedClass.formTeacher).trim() : '';
    const classFormTeacherLower = classFormTeacher.toLowerCase();
    const classFormTeacherName = selectedClass.formTeacherName ? String(selectedClass.formTeacherName).trim().toLowerCase() : '';
    const classFormTeacherId = (selectedClass as any).formTeacherId ? String((selectedClass as any).formTeacherId).trim().toLowerCase() : '';
    const classTeacher = (selectedClass as any).teacher ? String((selectedClass as any).teacher).trim().toLowerCase() : '';

    return Boolean(
      (user.classId && selectedClass.id === user.classId) ||
      (userIdLower && (
        classFormTeacherLower === userIdLower ||
        classFormTeacherId === userIdLower ||
        classTeacher === userIdLower
      )) ||
      (userTeacherIdLower && (
        classFormTeacherLower === userTeacherIdLower ||
        classFormTeacherId === userTeacherIdLower ||
        classTeacher === userTeacherIdLower
      )) ||
      (userNameLower && (
        classFormTeacherLower === userNameLower ||
        classFormTeacherName === userNameLower ||
        classTeacher === userNameLower
      ))
    );
  }, [role, user, selectedClass]);

  const canMarkAttendance = role === 'teacher' && isFormTeacher;

  // Check if forbidden (e.g. user is not the form teacher of this class)
  const isForbidden =
    (attendanceError as any)?.response?.status === 403 ||
    (attendanceError as any)?.status === 403;

  // Calendar and trend computations matching lumio-react
  const currentMonthDate = useMemo(() => new Date(selectedDate), [selectedDate]);
  const monthTitle = useMemo(() => format(currentMonthDate, 'MMMM yyyy'), [currentMonthDate]);

  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthDate), [currentMonthDate]);
  const firstDayOfWeek = useMemo(() => {
    const firstDay = startOfMonth(currentMonthDate);
    const day = getDay(firstDay);
    return (day + 6) % 7;
  }, [currentMonthDate]);

  const calendarCells = useMemo(() => {
    return Array.from(
      { length: firstDayOfWeek + daysInMonth },
      (_, i) => (i < firstDayOfWeek ? null : i - firstDayOfWeek + 1)
    );
  }, [firstDayOfWeek, daysInMonth]);

  function dayRate(d: number) {
    if (d % 7 === 0 || d % 7 === 6) return -1; // weekend
    return 80 + ((d * 7) % 20);
  }

  const attendanceTrendData = useMemo(
    () => [
      { month: 'Jan', present: 93 },
      { month: 'Feb', present: 90 },
      { month: 'Mar', present: 94 },
      { month: 'Apr', present: 89 },
      { month: 'May', present: 92 },
      { month: 'Jun', present: 95 },
    ],
    []
  );

  async function handleSaveRoster(marks: Record<string, AttendanceStatus>) {
    if (!canMarkAttendance || !selectedClassId) return;

    const entries = Object.entries(marks).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    // If attendance was already recorded for this class & date, use PATCH endpoint
    const isAlreadyMarked = students.some((s) => s.status !== null);

    if (isAlreadyMarked && updateMutation) {
      await updateMutation.mutateAsync({
        classId: selectedClassId,
        date: selectedDate,
        entries,
      });
    } else {
      try {
        await saveMutation.mutateAsync({
          classId: selectedClassId,
          date: selectedDate,
          entries,
        });
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : '');

        // If backend responds that attendance has already been marked, fallback to PATCH
        if (errorMsg.toLowerCase().includes('already been marked') && updateMutation) {
          await updateMutation.mutateAsync({
            classId: selectedClassId,
            date: selectedDate,
            entries,
          });
        } else {
          throw err;
        }
      }
    }
  }

  // Parents have dedicated ward attendance view that guarantees privacy of other students
  if (role === 'parent') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ward Attendance"
          description="Review your child's daily presence and monthly attendance rate."
        />
        <ParentAttendanceView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={
          role === 'admin'
            ? 'View class attendance registers and track school-wide student presence.'
            : canMarkAttendance
            ? 'Mark daily attendance and track student presence.'
            : 'Track student attendance and review class presence records.'
        }
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Date picker */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <CalendarIcon className="h-4 w-4" />
              </span>
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Class selector */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SchoolIcon className="h-4 w-4" />
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={classesLoading || classes.length === 0}
                aria-label="Select class"
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-w-[160px]"
              >
                {classes.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatClassName(c)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        }
      />

      {/* Administrator View Banner */}
      {role === 'admin' && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs text-slate-700">
          <EyeIcon className="h-4 w-4 text-slate-500 shrink-0" />
          <span>
            Administrator View (Read-Only) — Student attendance marking is reserved for designated Form Teachers. You have full access to view daily registers and KPI metrics.
          </span>
        </div>
      )}

      {/* Form Teacher Authorized Banner */}
      {!isForbidden && canMarkAttendance && (
        <div className="flex items-center gap-2 rounded-xl bg-gold-50/70 border border-gold-200/80 px-4 py-2.5 text-xs text-gold-900">
          <ShieldCheckIcon className="h-4 w-4 text-gold-600 shrink-0" />
          <span>You are the designated Form Teacher for {classNameDisplay}. Register recording and submissions are active.</span>
        </div>
      )}

      {/* Non-Form Teacher Read-Only Notice */}
      {role === 'teacher' && !isFormTeacher && !isForbidden && selectedClass && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200/80 px-4 py-2.5 text-xs text-amber-900">
          <LockIcon className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Read-Only Register — Only the appointed Form Teacher of {classNameDisplay} can record or modify attendance.
          </span>
        </div>
      )}

      {/* Access Restriction Warning Banner */}
      {isForbidden && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-sm text-amber-900"
        >
          <LockIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">
              Form Teacher Access Required
            </p>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
              In Lumio, class attendance registers can only be accessed and recorded
              by the appointed Form Teacher of the class. If you are a school administrator,
              ensure a form teacher is assigned to this cohort in the Staff directory.
            </p>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {attendanceError && !isForbidden && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800"
        >
          <AlertCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-medium">Failed to load attendance records</p>
            <p className="text-xs text-red-600">
              {(attendanceError as any)?.response?.data?.message ||
                attendanceError.message ||
                'An error occurred'}
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <AttendanceSummaryCards
        summary={liveSummary}
        classNameDisplay={classNameDisplay}
      />

      {/* 2-Column Responsive Layout matching lumio-react: Roster (lg:col-span-3) + Calendar & Analytics (lg:col-span-2) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Register Roster Column */}
        <div className="lg:col-span-3">
          {attendanceLoading ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-100 bg-white shadow-xs">
              <Loader2Icon className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-3 text-sm text-slate-500">Loading student roster…</p>
            </div>
          ) : !isForbidden ? (
            <AttendanceRoster
              students={students}
              date={selectedDate}
              classNameDisplay={classNameDisplay}
              onSave={canMarkAttendance ? handleSaveRoster : undefined}
              isSaving={canMarkAttendance ? (saveMutation.isPending || Boolean(updateMutation?.isPending)) : false}
              onSummaryChange={setLiveSummary}
              readOnly={!canMarkAttendance}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-12 text-center">
              <LockIcon className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="font-semibold text-amber-900">Roster Locked</p>
              <p className="mt-1 text-xs text-amber-700 max-w-sm mx-auto">
                Only the assigned Form Teacher of {classNameDisplay} can record and edit this register.
                Macro-level analytics and monthly trends remain visible.
              </p>
            </div>
          )}
        </div>

        {/* Calendar + Trend Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Calendar Card */}
          <Card className="border-slate-100 bg-white shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {monthTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarCells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const r = dayRate(d);
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-semibold',
                        r < 0
                          ? 'text-slate-300'
                          : r >= 95
                          ? 'bg-emerald-100 text-emerald-700'
                          : r >= 85
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gold-100 text-gold-600'
                      )}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  ≥95%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                  85–94%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
                  &lt;85%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Card */}
          <Card className="border-slate-100 bg-white shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Monthly trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceArea data={attendanceTrendData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

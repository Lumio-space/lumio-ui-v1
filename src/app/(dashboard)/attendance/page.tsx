'use client';

/**
 * Attendance Page — /attendance
 *
 * Full Attendance Register and Tracking View.
 * Matches lumio-react/src/pages/AttendancePage.tsx UI/UX.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  SchoolIcon,
  AlertCircleIcon,
  LockIcon,
  Loader2Icon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import {
  useClassAttendance,
  useSaveAttendance,
  AttendanceSummaryCards,
  AttendanceRoster,
  type ClassAttendanceSummary,
  type AttendanceStatus,
} from '@/features/attendance';
import { useAuthStore } from '@/stores/auth.store';

export default function AttendancePage() {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: rawClasses = [], isLoading: classesLoading } = useClasses();
  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Default to first class if none selected
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  const classNameDisplay = selectedClass ? formatClassName(selectedClass) : 'Class';

  // Attendance query
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch,
  } = useClassAttendance(selectedClassId, selectedDate);

  const saveMutation = useSaveAttendance();

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

  // Check if forbidden (e.g. user is not the form teacher of this class)
  const isForbidden =
    (attendanceError as any)?.response?.status === 403 ||
    (attendanceError as any)?.status === 403;

  async function handleSaveRoster(marks: Record<string, AttendanceStatus>) {
    if (!selectedClassId) return;

    const entries = Object.entries(marks).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    await saveMutation.mutateAsync({
      classId: selectedClassId,
      date: selectedDate,
      entries,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark daily attendance and track student presence."
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

      {/* Register Roster View */}
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
          onSave={handleSaveRoster}
          isSaving={saveMutation.isPending}
          onSummaryChange={setLiveSummary}
        />
      ) : null}
    </div>
  );
}

'use client';

/**
 * ParentAttendanceView
 *
 * Dedicated attendance view for Parents.
 * Protects class student roster privacy while providing comprehensive
 * daily and monthly attendance tracking for their linked ward(s).
 */

import React, { useState, useMemo } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import {
  CalendarIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  UserCheckIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  GraduationCapIcon,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/shared/Progress';
import { AttendanceArea } from '@/components/charts/Charts';
import { useParentChildren } from '@/features/parents/hooks';
import { MessageTeacherModal } from '@/features/parents/components/MessageTeacherModal';
import { cn } from '@/lib/utils';

export function ParentAttendanceView() {
  const {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading,
  } = useParentChildren();

  const [messageTeacherOpen, setMessageTeacherOpen] = useState(false);

  // Month computations
  const currentMonthDate = useMemo(() => new Date(), []);
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

  // Attendance rate simulation for ward calendar
  function getDayAttendanceStatus(day: number) {
    if (day % 7 === 0 || day % 7 === 6) return 'weekend';
    if (day === 14) return 'absent'; // 1 absent day in the month
    if (day > new Date().getDate()) return 'upcoming';
    return 'present';
  }

  const attendanceTrendData = useMemo(
    () => [
      { month: 'Jan', present: 94, absent: 6 },
      { month: 'Feb', present: 92, absent: 8 },
      { month: 'Mar', present: 95, absent: 5 },
      { month: 'Apr', present: 91, absent: 9 },
      { month: 'May', present: 96, absent: 4 },
      { month: 'Jun', present: 94, absent: 6 },
    ],
    []
  );

  if (isLoading && !selectedChild) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <Card className="border-slate-100 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-3">
            <GraduationCapIcon className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-bold text-slate-900">
            No Linked Ward Found
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Attendance records require a linked student profile. Please contact the school administration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child Switcher (if multiple children exist) */}
      {children.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Select Ward">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Select Ward:
          </span>
          {children.map((child) => {
            const isSelected = selectedChild?.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0',
                  isSelected
                    ? 'bg-indigo-900 text-white shadow-soft ring-1 ring-indigo-900'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                )}
              >
                <Avatar name={child.name} src={child.avatar} size="xs" />
                <span>{child.name}</span>
                <span
                  className={cn(
                    'text-[10px] rounded-md px-1.5 py-0.5',
                    isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {child.className || child.grade}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ward Header Card */}
      <Card className="border-slate-100 bg-white">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar
            name={selectedChild.name}
            src={selectedChild.avatar}
            size="xl"
            ring
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                {selectedChild.name}
              </h2>
              <Badge tone="green" dot>
                Enrolled
              </Badge>
              {selectedChild.className && (
                <Badge tone="indigo">{selectedChild.className}</Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {selectedChild.grade} · Section {selectedChild.section} · Roll #{selectedChild.rollNo} · {selectedChild.admissionNo}
            </p>

            {selectedChild.formTeacher && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserCheckIcon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Form Teacher:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedChild.formTeacher.name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setMessageTeacherOpen(true)}
                  className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  <MessageSquareIcon className="h-3 w-3" />
                  Contact Form Teacher
                </button>
              </div>
            )}
          </div>

          {/* Donut Widget */}
          <div className="flex items-center gap-6 sm:flex-col sm:items-end">
            <div className="text-center">
              <ProgressRing value={selectedChild.attendance} size={84}>
                <div className="text-center">
                  <span className="block font-display text-lg font-extrabold text-slate-900">
                    {selectedChild.attendance}%
                  </span>
                </div>
              </ProgressRing>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Present Rate
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary KPI Chips */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold text-slate-900">19</p>
              <p className="text-xs text-slate-400">Days Present</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <XCircleIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold text-slate-900">1</p>
              <p className="text-xs text-slate-400">Days Absent</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
              <ClockIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold text-slate-900">0</p>
              <p className="text-xs text-slate-400">Late Arrivals</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold text-slate-900">
                {selectedChild.attendance}%
              </p>
              <p className="text-xs text-slate-400">Term Average</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Monthly Calendar & Trend Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calendar Card */}
        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              {monthTitle} — Attendance Log
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
                const status = getDayAttendanceStatus(d);
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-semibold',
                      status === 'weekend'
                        ? 'text-slate-300'
                        : status === 'absent'
                        ? 'bg-rose-100 text-rose-700'
                        : status === 'upcoming'
                        ? 'text-slate-400 border border-slate-100'
                        : 'bg-emerald-100 text-emerald-700'
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
                Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                Weekend / Scheduled
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Card */}
        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Annual Attendance Trend
            </CardTitle>
            <CardDescription>Monthly presence record this academic year</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceArea data={attendanceTrendData} />
          </CardContent>
        </Card>
      </div>

      {/* Direct Pastoral Communication Modal */}
      {selectedChild.formTeacher && (
        <MessageTeacherModal
          open={messageTeacherOpen}
          onClose={() => setMessageTeacherOpen(false)}
          teacherName={selectedChild.formTeacher.name || 'Form Teacher'}
          studentName={selectedChild.name}
          className={selectedChild.className}
          teacherEmail={selectedChild.formTeacher.email}
        />
      )}
    </div>
  );
}

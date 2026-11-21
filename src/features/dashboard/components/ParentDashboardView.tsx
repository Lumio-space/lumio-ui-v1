'use client';

/**
 * ParentDashboardView
 *
 * Primary parent experience dashboard.
 * Migrated from lumio-react/src/components/dashboard/ParentDashboard.tsx.
 *
 * Features:
 *  - Child switcher for parents with multiple enrolled wards
 *  - Ward profile header with active status, grade, section, roll number, admission number
 *  - Form Teacher pastoral contact lead with direct messaging trigger
 *  - Quick action links (Attendance, Results, Timetable, Message Teacher)
 *  - Circular attendance ring widget
 *  - Academic results breakdown with letter grades and color-coded progress bars
 *  - Today's schedule periods with time slots and room numbers
 *  - Monthly attendance trend area chart
 *  - School updates & read-only fee assessment notices
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CalendarCheckIcon,
  ClipboardListIcon,
  AwardIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  ClockIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  ReceiptIcon,
  UserCheckIcon,
  GraduationCapIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
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
import { Progress, ProgressRing } from '@/components/shared/Progress';
import { AttendanceArea } from '@/components/charts/Charts';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { useParentChildren } from '@/features/parents/hooks';
import { MessageTeacherModal } from '@/features/parents/components/MessageTeacherModal';
import { cn } from '@/lib/utils';

export function ParentDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Parent';

  const {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading,
  } = useParentChildren();

  const [messageTeacherOpen, setMessageTeacherOpen] = useState(false);

  // Today's day of the week
  const todayDayName = useMemo(() => format(new Date(), 'EEEE'), []);

  // Attendance trend data matching lumio-react
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

  // School updates matching lumio-react announcements
  const schoolUpdates = useMemo(
    () => [
      {
        id: 'u1',
        title: 'Upcoming Parent-Teacher Meeting',
        body: 'Term 1 progress review meetings will take place next Friday from 2:00 PM to 6:00 PM.',
        author: 'Principal Office',
        date: '2 days ago',
      },
      {
        id: 'u2',
        title: 'Annual Sports Day Notice',
        body: 'Inter-house athletic trials begin this Wednesday. Students should come in proper sports attire.',
        author: 'Sports Department',
        date: '3 days ago',
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Role Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-6 sm:p-7 text-white shadow-xs">
        <p className="text-sm font-medium text-indigo-200">
          Welcome back, {firstName} 👋
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          Parent Workspace — {schoolName}
        </h2>
        <p className="mt-1 text-xs text-indigo-300">
          Monitor your ward&rsquo;s attendance, academic performance, and communicate directly with teachers.
        </p>
      </div>

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

      {/* Loading Skeleton */}
      {isLoading && !selectedChild && (
        <div className="animate-pulse space-y-6">
          <div className="h-44 rounded-2xl bg-slate-100" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-64 rounded-2xl bg-slate-100 lg:col-span-2" />
            <div className="h-64 rounded-2xl bg-slate-100" />
          </div>
        </div>
      )}

      {/* No Linked Children Empty State */}
      {!isLoading && !selectedChild && (
        <Card className="border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-3">
              <GraduationCapIcon className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-slate-900">
              No Linked Students Found
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Your parent profile is currently not connected to an enrolled student.
              Please reach out to your school administration to link your ward.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Child Header Card matching lumio-react */}
      {selectedChild && (
        <>
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
                    Active
                  </Badge>
                  {selectedChild.className && (
                    <Badge tone="indigo">
                      {selectedChild.className}
                    </Badge>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedChild.grade} · Section {selectedChild.section} · Roll #{selectedChild.rollNo} · {selectedChild.admissionNo}
                </p>

                {/* Form Teacher Pastoral Lead Badge */}
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

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link href="/attendance">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<CalendarCheckIcon className="h-4 w-4" />}
                    >
                      Attendance
                    </Button>
                  </Link>

                  <Link href="/results">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<ClipboardListIcon className="h-4 w-4" />}
                    >
                      Results
                    </Button>
                  </Link>

                  <Link href="/timetable">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<CalendarDaysIcon className="h-4 w-4" />}
                    >
                      Timetable
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<MessageSquareIcon className="h-4 w-4" />}
                    onClick={() => setMessageTeacherOpen(true)}
                  >
                    Message teacher
                  </Button>
                </div>
              </div>

              {/* Attendance Donut Ring */}
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
                    Attendance
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Row 1: Academic Results & Today's Classes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Results overview */}
            <Card className="border-slate-100 bg-white lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AwardIcon className="h-5 w-5 text-gold-500" />
                  <CardTitle>Academic results</CardTitle>
                </div>
                <Link
                  href="/results"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  View report card
                </Link>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedChild.results && selectedChild.results.length > 0 ? (
                  selectedChild.results.map((res) => (
                    <div key={res.subject}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{res.subject}</span>
                        <span className="flex items-center gap-2">
                          <Badge tone={res.tone}>{res.grade}</Badge>
                          <span className="font-bold text-slate-900">{res.score}%</span>
                        </span>
                      </div>
                      <Progress
                        value={res.score}
                        tone={res.score >= 80 ? 'green' : res.score >= 60 ? 'gold' : 'red'}
                        size="sm"
                        label={res.subject}
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">No grades recorded yet</p>
                    <p className="mt-1">Academic assessments will appear once published by teachers.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's classes */}
            <Card className="border-slate-100 bg-white">
              <CardHeader>
                <div>
                  <CardTitle>Today&rsquo;s classes</CardTitle>
                  <CardDescription>{todayDayName}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedChild.schedule && selectedChild.schedule.length > 0 ? (
                  selectedChild.schedule.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {slot.subject}
                          </p>
                          <p className="text-[11px] text-slate-400">{slot.time}</p>
                        </div>
                      </div>
                      {slot.room && (
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-2xs">
                          {slot.room}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No classes scheduled for today.
                  </p>
                )}

                <Link href="/timetable" className="block pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-indigo-700 hover:text-indigo-900"
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  >
                    Full timetable
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Attendance Trend & School Updates / Fee Notices */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Attendance trend */}
            <Card className="border-slate-100 bg-white lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Attendance trend</CardTitle>
                  <CardDescription>Monthly present rate this academic year</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AttendanceArea data={attendanceTrendData} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                    <span>Consistent attendance record ({selectedChild.attendance}% overall)</span>
                  </div>
                  <Link
                    href="/attendance"
                    className="font-semibold text-purple-600 hover:text-purple-700"
                  >
                    View daily register →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* School updates & Fee notices */}
            <Card className="border-slate-100 bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>School notices</CardTitle>
                  <CardDescription>Updates & bursary notifications</CardDescription>
                </div>
                <MegaphoneIcon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent className="space-y-3.5">
                {/* Read-only Fee Notice Card */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-xs text-indigo-900">
                      <ReceiptIcon className="h-3.5 w-3.5 text-indigo-600" />
                      Term 2 Tuition & Resource Assessment
                    </span>
                    <Badge tone="green" dot>
                      Paid
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    All academic term assessments for {selectedChild.name} are up to date.
                  </p>
                </div>

                {/* Announcement Items */}
                {schoolUpdates.map((notice) => (
                  <div
                    key={notice.id}
                    className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900">
                      {notice.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {notice.body}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{notice.author}</span>
                      <span>{notice.date}</span>
                    </div>
                  </div>
                ))}

                <Link href="/announcements" className="block pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-indigo-700 hover:text-indigo-900"
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  >
                    View all notices
                  </Button>
                </Link>
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
        </>
      )}
    </div>
  );
}

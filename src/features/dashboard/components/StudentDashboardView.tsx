'use client';

import Link from 'next/link';
import {
  CalendarCheckIcon,
  ClipboardListIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  ArrowRightIcon,
  GraduationCapIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';

export function StudentDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-6 sm:p-7 text-white shadow-xs">
        <p className="text-sm font-medium text-indigo-200">
          Welcome back, {firstName} 👋
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          Student Workspace — {schoolName}
        </h2>
        <p className="mt-1 text-xs text-indigo-300">
          Access your timetable, attendance records, exam results, and school announcements.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/timetable">
          <Card className="border-slate-100 bg-white hover:shadow-card transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                  <CalendarDaysIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-slate-800">Timetable</p>
                  <p className="text-xs text-slate-400">Class schedule</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/attendance">
          <Card className="border-slate-100 bg-white hover:shadow-card transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <CalendarCheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-slate-800">Attendance</p>
                  <p className="text-xs text-slate-400">Your presence logs</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/results">
          <Card className="border-slate-100 bg-white hover:shadow-card transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <ClipboardListIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-slate-800">My Results</p>
                  <p className="text-xs text-slate-400">Academic reports</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/announcements">
          <Card className="border-slate-100 bg-white hover:shadow-card transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MegaphoneIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-slate-800">Announcements</p>
                  <p className="text-xs text-slate-400">School notices</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Student Academic Status Card */}
      <Card className="border-slate-100 bg-white">
        <CardHeader>
          <CardTitle>Academic Records</CardTitle>
          <CardDescription>Your registered student profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-3">
              <GraduationCapIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Student portal active
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Your registered courses, upcoming exams, and published term grades will display here once available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

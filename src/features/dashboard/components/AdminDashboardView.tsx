'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  UsersIcon,
  BookOpenIcon,
  LibraryBigIcon,
  UserPlusIcon,
  GraduationCapIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  SchoolIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/shared/Badge';
import { AttendanceArea, EnrollmentDonut } from '@/components/charts/Charts';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { useTeachers } from '@/features/teachers/hooks';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import { useStudents } from '@/features/students/hooks';
import { useParents } from '@/features/parents/hooks';
import {
  useAdminDashboardOverview,
  useAdminAttendanceOverview,
  useAdminEnrollmentByGrade,
} from '../hooks/useAdminDashboard';
import type { ClassRecord } from '@/features/classes/types';
import type { TeacherRecord } from '@/features/teachers/types';

function mapGradeToLevel(grade: string): 'nursery' | 'primary' | 'junior_secondary' | 'senior_secondary' {
  const g = grade.toLowerCase();
  if (g.startsWith('nursery') || g.includes('kindergarten')) return 'nursery';
  if (g.startsWith('primary')) return 'primary';
  if (g.startsWith('jss')) return 'junior_secondary';
  if (g.startsWith('sss') || g.startsWith('ss')) return 'senior_secondary';
  return 'primary';
}

export function AdminDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Administrator';

  // Compute 6-month date range for attendance trend overview
  const { fromDate, toDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    return {
      fromDate: format(start, 'yyyy-MM-dd'),
      toDate: format(end, 'yyyy-MM-dd'),
    };
  }, []);

  // Live Backend Dashboard API Hooks
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useAdminDashboardOverview();

  const {
    data: rawAttendanceTrend = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
  } = useAdminAttendanceOverview(fromDate, toDate);

  const {
    data: rawEnrollment = [],
    isLoading: enrollmentLoading,
    isError: enrollmentError,
  } = useAdminEnrollmentByGrade();

  const { data: teachers = [] } = useTeachers();
  const { data: rawClasses = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: studentsResponse } = useStudents();
  const { data: parentsResponse } = useParents();

  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const studentsList = useMemo(() => {
    return studentsResponse?.data || [];
  }, [studentsResponse]);

  const totalStudentsFallback = studentsResponse?.total ?? studentsList.length;

  const activeTeachers = teachers.filter(
    (t: TeacherRecord) => t.status?.toLowerCase() === 'active'
  );
  const recentClasses = classes.slice(0, 5);

  const teacherMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((t: TeacherRecord) => {
      const name = t.fullName || t.name;
      if (name) {
        if (t.userId) map.set(t.userId, name);
        if (t.id) map.set(t.id, name);
      }
    });
    return map;
  }, [teachers]);

  const classFormTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((t: TeacherRecord) => {
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
  }, [teachers]);

  // Real Enrollment by Grade Level distribution (no mock/fake fallbacks)
  const enrollmentData = useMemo(() => {
    if (!rawEnrollment || rawEnrollment.length === 0) return [];

    const levelCounts: Record<string, number> = {
      nursery: 0,
      primary: 0,
      junior_secondary: 0,
      senior_secondary: 0,
    };

    rawEnrollment.forEach((item) => {
      const lvl = mapGradeToLevel(item.gradeLevel);
      levelCounts[lvl] = (levelCounts[lvl] || 0) + (Number(item.count) || 0);
    });

    const entries = [
      { name: 'Nursery', value: levelCounts.nursery || 0, color: '#10B981' },
      { name: 'Primary', value: levelCounts.primary || 0, color: '#6366F1' },
      {
        name: 'Junior Sec.',
        value: levelCounts.junior_secondary || 0,
        color: '#F59E0B',
      },
      {
        name: 'Senior Sec.',
        value: levelCounts.senior_secondary || 0,
        color: '#8B5CF6',
      },
    ];

    return entries.filter((e) => e.value > 0);
  }, [rawEnrollment]);

  // Real Monthly Attendance Trend (no mock/fake fallbacks)
  const attendanceTrend = useMemo(() => {
    if (!rawAttendanceTrend || rawAttendanceTrend.length === 0) return [];

    return rawAttendanceTrend.map((item) => {
      let label = item.month;
      try {
        const [y, m] = item.month.split('-');
        if (y && m) {
          const d = new Date(Number(y), Number(m) - 1, 1);
          label = format(d, 'MMM');
        }
      } catch {
        label = item.month;
      }
      return {
        month: label,
        present: item.presentRate,
      };
    });
  }, [rawAttendanceTrend]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-6 sm:p-7 text-white shadow-xs">
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
              Administrator Workspace — {schoolName}
            </h2>
            <p className="mt-1 text-xs text-indigo-300">
              School operations, student enrollment, teachers, and academic structure overview.
            </p>
          </div>
          <Link href="/teachers">
            <Button
              className="bg-gold-400 text-indigo-950 font-bold hover:bg-gold-300"
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Manage Teachers
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards matching live metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Students"
          value={overviewLoading ? '...' : (overview?.totalStudents ?? totalStudentsFallback)}
          icon={<GraduationCapIcon className="h-5 w-5" />}
          tone="indigo"
          delay={0}
        />
        <StatCard
          label="Total Teachers"
          value={overviewLoading ? '...' : (overview?.totalTeachers ?? teachers.length)}
          icon={<UsersIcon className="h-5 w-5" />}
          tone="purple"
          delay={0.05}
        />
        <StatCard
          label="Active Classes"
          value={overviewLoading ? '...' : (overview?.totalClasses ?? classes.length)}
          icon={<BookOpenIcon className="h-5 w-5" />}
          tone="green"
          delay={0.1}
        />
        <StatCard
          label="Total Subjects"
          value={subjects.length}
          icon={<LibraryBigIcon className="h-5 w-5" />}
          tone="gold"
          delay={0.15}
        />
        <StatCard
          label="Avg. Attendance"
          value={overviewLoading ? '...' : `${overview?.averageAttendance ?? 0}%`}
          icon={<TrendingUpIcon className="h-5 w-5" />}
          tone="purple"
          delay={0.2}
        />
      </div>

      {/* Charts Row matching live backend data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-100 bg-white shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Attendance overview</CardTitle>
              <CardDescription>
                Monthly present rate across all classes
              </CardDescription>
            </div>
            <Badge tone="purple" dot>
              This term
            </Badge>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                Loading attendance trend…
              </div>
            ) : attendanceError ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-red-500">
                Failed to load attendance trends.
              </div>
            ) : attendanceTrend.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center text-center p-6 text-slate-400">
                <TrendingUpIcon className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No Attendance Records Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Monthly attendance rates will display here as class registers are marked.
                </p>
              </div>
            ) : (
              <AttendanceArea data={attendanceTrend} />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader className="pb-2">
            <div>
              <CardTitle>Enrollment</CardTitle>
              <CardDescription>By grade level distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {enrollmentLoading ? (
              <div className="flex h-44 items-center justify-center text-sm text-slate-400">
                Loading enrollment distribution…
              </div>
            ) : enrollmentError ? (
              <div className="flex h-44 items-center justify-center text-sm text-red-500">
                Failed to load enrollment distribution.
              </div>
            ) : enrollmentData.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center text-center p-4 text-slate-400">
                <GraduationCapIcon className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No Enrollment Data</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Student enrollment distribution will appear once students are active in classes.
                </p>
              </div>
            ) : (
              <EnrollmentDonut data={enrollmentData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Classes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/teachers"
              className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <UserPlusIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Invite Teacher
                  </p>
                  <p className="text-xs text-slate-400">Add teaching staff</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <Link
              href="/students"
              className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <GraduationCapIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Students
                  </p>
                  <p className="text-xs text-slate-400">Directory & enrollment</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <Link
              href="/classes"
              className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <BookOpenIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Classes
                  </p>
                  <p className="text-xs text-slate-400">Grade levels & rooms</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <Link
              href="/subjects"
              className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                  <LibraryBigIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Subjects
                  </p>
                  <p className="text-xs text-slate-400">Curriculum & allocations</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Classes Overview */}
        <Card className="lg:col-span-2 border-slate-100 bg-white shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Active Classes</CardTitle>
              <CardDescription>Recently configured classes</CardDescription>
            </div>
            <Link href="/classes">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-700">
                View all ({classes.length})
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentClasses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No classes created yet.{' '}
                <Link href="/classes" className="text-purple-600 underline font-medium">
                  Create first class
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClasses.map((c: ClassRecord) => {
                  const formTeacherName =
                    c.formTeacherName ||
                    (c.formTeacher
                      ? teacherMap.get(c.formTeacher) ||
                        (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.formTeacher)
                          ? c.formTeacher
                          : undefined)
                      : undefined) ||
                    classFormTeacherMap.get(c.id);

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {c.grade} {c.section}
                        </p>
                        <p className="text-xs text-slate-400">
                          {c.level}
                          {c.department && c.department !== 'Nill' && ` · ${c.department}`}
                          {c.room && ` · Room ${c.room}`}
                        </p>
                      </div>
                      <Badge tone={formTeacherName ? 'indigo' : 'slate'}>
                        {formTeacherName ? `Form: ${formTeacherName}` : 'No form teacher'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  UsersIcon,
  BookOpenIcon,
  LibraryBigIcon,
  UserPlusIcon,
  GraduationCapIcon,
  ArrowRightIcon,
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
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { useTeachers } from '@/features/teachers/hooks';
import { useClasses } from '@/features/classes/hooks';
import { useSubjects } from '@/features/subjects/hooks';
import type { ClassRecord } from '@/features/classes/types';
import type { TeacherRecord } from '@/features/teachers/types';

export function AdminDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Administrator';

  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const activeTeachers = teachers.filter((t: TeacherRecord) => t.status === 'Active');
  const recentClasses = classes.slice(0, 5);

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
              School operations, teachers, classes, and academic structure overview.
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

      {/* Real Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Teachers"
          value={teachers.length}
          icon={<UsersIcon className="h-5 w-5" />}
          tone="purple"
          delay={0}
        />
        <StatCard
          label="Active Classes"
          value={classes.length}
          icon={<BookOpenIcon className="h-5 w-5" />}
          tone="indigo"
          delay={0.05}
        />
        <StatCard
          label="Total Subjects"
          value={subjects.length}
          icon={<LibraryBigIcon className="h-5 w-5" />}
          tone="gold"
          delay={0.1}
        />
      </div>

      {/* Quick Actions & Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-slate-100 bg-white">
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
                  <p className="text-xs text-slate-400">Configure grade levels</p>
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
                    View Students
                  </p>
                  <p className="text-xs text-slate-400">Enrollment & records</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Classes Overview */}
        <Card className="lg:col-span-2 border-slate-100 bg-white">
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
                {recentClasses.map((c: ClassRecord) => (
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
                    <Badge tone={c.formTeacher ? 'indigo' : 'slate'}>
                      {c.formTeacher ? `Form: ${c.formTeacher}` : 'No form teacher'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

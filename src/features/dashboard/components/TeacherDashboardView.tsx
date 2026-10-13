'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpenIcon,
  UsersIcon,
  CalendarCheckIcon,
  ArrowRightIcon,
  LibraryBigIcon,
  MegaphoneIcon,
  LayersIcon,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
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
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';

export function TeacherDashboardView() {
  const user = useAuthStore((s) => s.user);
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Your School';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Teacher';

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  // Find classes assigned to this teacher
  const myClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c: ClassRecord) => {
      const matchesDirectClass = Boolean(user.classId && c.id === user.classId);
      const matchesFormTeacherId = Boolean(user.id && c.formTeacher === user.id);
      const matchesFormTeacherName = Boolean(user.name && c.formTeacher === user.name);
      const matchesTeacherId = Boolean(user.id && c.teacher && c.teacher === user.id);
      const matchesTeacherName = Boolean(user.name && c.teacher && c.teacher === user.name);
      return (
        matchesDirectClass ||
        matchesFormTeacherId ||
        matchesFormTeacherName ||
        matchesTeacherId ||
        matchesTeacherName
      );
    });
  }, [classes, user]);

  // Find subjects assigned to this teacher
  const mySubjects = useMemo(() => {
    if (!user) return [];
    return subjects.filter((s: SubjectRecord) => {
      const matchesOffering = s.offerings?.some(
        (o) =>
          Boolean(user.id && o.teacherIds?.includes(user.id)) ||
          Boolean(user.classId && o.classId === user.classId)
      );
      const matchesClass = Boolean(user.classId && s.classIds?.includes(user.classId));
      return matchesOffering || matchesClass;
    });
  }, [subjects, user]);

  const totalStudents = myClasses.reduce(
    (acc: number, c: ClassRecord) => acc + (c.students ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-indigo-900 p-6 text-white sm:p-7 shadow-xs">
        <p className="text-sm font-medium text-indigo-200">
          Welcome back, {firstName} 👋
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          Teacher Workspace — {schoolName}
        </h2>
        <p className="mt-1.5 text-xs text-indigo-300">
          {myClasses.length > 0
            ? `You are assigned to ${myClasses.length} ${myClasses.length === 1 ? 'class' : 'classes'}.`
            : 'Your school administrator will assign classes and subjects to you.'}
        </p>
      </div>

      {/* Teacher Workload Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* My Classes */}
        <Card className="lg:col-span-2 border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>My Assigned Classes</CardTitle>
              <CardDescription>Active teaching and form classes</CardDescription>
            </div>
            <Link href="/my-classes">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                className="text-xs font-semibold text-indigo-700"
              >
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-3">
                  <LayersIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  No classes assigned yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your administrator will assign classes and subjects to your profile.
                </p>
              </div>
            ) : (
              myClasses.map((c: ClassRecord) => {
                const isForm =
                  c.id === user?.classId ||
                  c.formTeacher === user?.name ||
                  c.formTeacher === user?.id;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {c.grade} {c.section}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.level}
                        {c.department && c.department !== 'Nill' && ` · ${c.department}`}
                        {c.room && ` · Room ${c.room}`}
                        {c.students ? ` · ${c.students} students` : ''}
                      </p>
                    </div>
                    {isForm && (
                      <Badge tone="gold" dot>
                        Form teacher
                      </Badge>
                    )}
                  </div>
                );
              })
            )}

            {myClasses.length > 0 && (
              <div className="pt-2">
                <Link href="/attendance">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<CalendarCheckIcon className="h-4 w-4" />}
                  >
                    Take Attendance
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links & Announcements */}
        <div className="space-y-6">
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-3">
              <CardTitle>My Subjects</CardTitle>
              <CardDescription>Curriculum assignments</CardDescription>
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
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"
                  >
                    <span className="text-xs font-semibold text-slate-800">
                      {s.name}
                    </span>
                    <Badge tone="indigo">{s.code}</Badge>
                  </div>
                ))
              )}
              <Link href="/my-subjects" className="block pt-2">
                <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-700">
                  Manage My Subjects
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MegaphoneIcon className="h-4 w-4 text-purple-600" />
                <CardTitle>Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-xs text-slate-400">
                No new announcements at this time
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMounted } from '@/hooks/useMounted';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { AdminDashboardView } from './AdminDashboardView';
import { TeacherDashboardView } from './TeacherDashboardView';
import { ParentDashboardView } from './ParentDashboardView';
import { StudentDashboardView } from './StudentDashboardView';
import { NoSchoolMembershipView } from './NoSchoolMembershipView';

export function DashboardView() {
  const isMounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const schoolName = useSchoolStore((s) => s.schoolName);

  // During SSR and initial client hydration, render a skeleton to avoid mismatch
  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  // 1. Check if authenticated user has an active school membership
  const hasActiveSchool = Boolean(user?.schoolId || schoolName);
  if (!hasActiveSchool) {
    return <NoSchoolMembershipView />;
  }

  // 2. Strict Role-based rendering with zero fallback between roles
  if (role === 'admin') {
    return <AdminDashboardView />;
  }

  if (role === 'teacher') {
    return <TeacherDashboardView />;
  }

  if (role === 'parent') {
    return <ParentDashboardView />;
  }

  if (role === 'student') {
    return <StudentDashboardView />;
  }

  // If role is undefined or unrecognized, render an explicit message — never fallback
  return (
    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-12 text-center">
      <p className="font-semibold text-rose-700">
        Unauthorized: Unrecognized account role. Please log in with a valid account.
      </p>
    </div>
  );
}

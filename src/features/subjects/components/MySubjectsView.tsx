'use client';

import { useMemo, useState } from 'react';
import {
  BookOpenIcon,
  SearchIcon,
  LayersIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { useSubjects } from '@/features/subjects/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { SubjectRecord } from '@/features/subjects/types';

export function MySubjectsView() {
  const user = useAuthStore((s) => s.user);
  const { data: subjects = [], isLoading, error } = useSubjects();
  const [query, setQuery] = useState('');

  // Filter subjects assigned to this teacher
  const mySubjects = useMemo(() => {
    if (!user) return [];
    return subjects.filter((s: SubjectRecord) => {
      const matchesOffering = s.offerings?.some(
        (o) =>
          (user.id ? o.teacherIds?.includes(user.id) : false) ||
          (user.classId && o.classId === user.classId)
      );
      const matchesClass = Boolean(user.classId && s.classIds?.includes(user.classId));
      return matchesOffering || matchesClass;
    });
  }, [subjects, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mySubjects;
    return mySubjects.filter(
      (s: SubjectRecord) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.section?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
    );
  }, [mySubjects, query]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Subjects"
          description="Subjects assigned to your teaching workload"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subjects"
        description={`The subjects ${user?.name ?? 'you'} are assigned to teach. Set by your school administrator.`}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Failed to load assigned subjects. Please refresh or try again later.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon={<BookOpenIcon className="h-5 w-5" />}
          tone="indigo"
        />
        <StatCard
          label="Active Allocations"
          value={mySubjects.reduce((acc, s) => acc + (s.classIds?.length ?? 0), 0)}
          icon={<LayersIcon className="h-5 w-5" />}
          tone="purple"
          delay={0.05}
        />
      </div>

      {mySubjects.length === 0 ? (
        <Card className="border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-4">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No subjects assigned yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Your school administrator will assign subjects and classes to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my subjects…"
              aria-label="Search my subjects"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="border-slate-100 bg-white">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                No subjects match your search query.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s: SubjectRecord) => {
                const assignedClassesCount = s.classIds?.length ?? 0;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-display text-xs font-extrabold text-indigo-700">
                        {s.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block font-display text-base font-extrabold text-slate-900 truncate">
                          {s.name}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge tone="indigo">{s.section}</Badge>
                          {s.department && (
                            <Badge tone="purple">{s.department}</Badge>
                          )}
                          {s.type && <Badge tone="slate">{s.type}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Assigned to{' '}
                        <span className="font-semibold text-slate-700">
                          {assignedClassesCount}
                        </span>{' '}
                        {assignedClassesCount === 1 ? 'class' : 'classes'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

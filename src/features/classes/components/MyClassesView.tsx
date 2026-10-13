'use client';

import { useMemo, useState } from 'react';
import {
  UsersIcon,
  SearchIcon,
  MapPinIcon,
  LayersIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';
import { Card, CardContent } from '@/components/ui/card';
import { useClasses } from '@/features/classes/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { ClassRecord } from '@/features/classes/types';

export function MyClassesView() {
  const user = useAuthStore((s) => s.user);
  const { data: classes = [], isLoading, error } = useClasses();
  const [query, setQuery] = useState('');

  // Filter classes assigned to the authenticated teacher
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return myClasses;
    return myClasses.filter(
      (c: ClassRecord) =>
        c.grade?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        c.level?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q)
    );
  }, [myClasses, query]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Classes"
          description="Classes assigned to your teaching schedule"
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
        title="My Classes"
        description={`The classes ${user?.name ?? 'you'} teach in. Access is granted per assigned class.`}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Failed to load assigned classes. Please refresh or try again later.
        </div>
      )}

      {myClasses.length === 0 ? (
        <Card className="border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-4">
              <LayersIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No classes assigned yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Your school administrator will assign classes and subjects to you.
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
              placeholder="Search my classes…"
              aria-label="Search my classes"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="border-slate-100 bg-white">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                No classes match your search query.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c: ClassRecord) => {
                const isForm =
                  c.id === user?.classId ||
                  c.formTeacher === user?.name ||
                  c.formTeacher === user?.id;

                return (
                  <div
                    key={c.id}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-base font-extrabold text-slate-900">
                          {c.grade} {c.section}
                        </p>
                        {c.room && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <MapPinIcon className="h-3 w-3" />
                            Room {c.room}
                          </p>
                        )}
                      </div>
                      {isForm && (
                        <Badge tone="gold" dot>
                          Form teacher
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone="indigo">{c.level}</Badge>
                      {c.department && c.department !== 'Nill' && (
                        <Badge tone="purple">{c.department}</Badge>
                      )}
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                      <UsersIcon className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {c.students ?? 0}
                      </span>{' '}
                      students
                    </p>
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

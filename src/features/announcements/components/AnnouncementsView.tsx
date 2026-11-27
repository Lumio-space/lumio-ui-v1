'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MegaphoneIcon,
  PlusIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import {
  ANNOUNCEMENTS_DEFAULT_LIMIT,
  AUDIENCE_LABELS,
  AUDIENCE_TONES,
} from '../constants';
import { useAnnouncements } from '../hooks';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';

function formatAnnouncementTimestamp(value: string): {
  relative: string;
  exact: string;
} {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { relative: value || 'Recently', exact: value || '' };
  }
  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    exact: format(date, 'MMM d, yyyy'),
  };
}

export function AnnouncementsView() {
  const role = useAuthStore((s) => s.role);
  const canCreate = role === 'admin';

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnnouncements(page, ANNOUNCEMENTS_DEFAULT_LIMIT);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const announcements = data?.data ?? [];
  const meta = data?.meta ?? {
    total: 0,
    page,
    limit: ANNOUNCEMENTS_DEFAULT_LIMIT,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description={
          canCreate
            ? 'Create and view school-wide notices for teachers, students, and parents.'
            : 'School notices and updates intended for your role.'
        }
        actions={
          canCreate ? (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              New announcement
            </Button>
          ) : undefined
        }
      />

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
            />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <AlertCircleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-red-800">
              Unable to load announcements
            </p>
            <p className="text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred while fetching announcements.'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            leftIcon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && announcements.length === 0 && (
        <Card className="border-slate-100 bg-white shadow-card">
          <EmptyState
            icon={<MegaphoneIcon className="h-7 w-7" />}
            title="No announcements yet"
            description={
              canCreate
                ? 'Publish your first announcement to notify teachers, students, or parents.'
                : 'There are no announcements available for your account at this time.'
            }
            action={
              canCreate ? (
                <Button
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => setCreateOpen(true)}
                >
                  New announcement
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {!isLoading && !isError && announcements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {announcements.length} of {meta.total} announcement
              {meta.total === 1 ? '' : 's'}
            </span>
            {isFetching && <span>Refreshing…</span>}
          </div>

          <div className="space-y-3">
            {announcements.map((item) => {
              const timestamp = formatAnnouncementTimestamp(item.createdAt);
              return (
                <Card
                  key={item.id}
                  className="border-slate-100 bg-white shadow-card transition-shadow hover:shadow-elevated"
                >
                  <CardContent className="p-5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="w-full text-left focus:outline-none"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-display text-base font-bold text-slate-900">
                          {item.title}
                        </h2>
                        <span
                          className="inline-flex items-center gap-1 text-xs text-slate-400"
                          title={timestamp.exact}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {timestamp.relative}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.message}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.audiences.map((aud) => (
                            <Badge key={aud} tone={AUDIENCE_TONES[aud]}>
                              {AUDIENCE_LABELS[aud]}
                            </Badge>
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                          Read notice
                          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs">
              <p className="text-xs font-medium text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canCreate && (
        <CreateAnnouncementModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(created) => {
            setPage(1);
            setSuccessMessage(
              `Announcement "${created.title}" published successfully.`
            );
          }}
        />
      )}

      <AnnouncementDetailModal
        announcementId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

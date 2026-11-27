'use client';

import { format } from 'date-fns';
import { AlertCircleIcon, CalendarIcon, RefreshCwIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { AUDIENCE_LABELS, AUDIENCE_TONES } from '../constants';
import { useAnnouncementDetail } from '../hooks';

interface AnnouncementDetailModalProps {
  announcementId: string | null;
  onClose: () => void;
}

function formatCreatedAt(value?: string): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM d, yyyy · h:mm a');
}

export function AnnouncementDetailModal({
  announcementId,
  onClose,
}: AnnouncementDetailModalProps) {
  const { data, isLoading, isError, error, refetch } =
    useAnnouncementDetail(announcementId);

  return (
    <Modal
      open={Boolean(announcementId)}
      onClose={onClose}
      title={data?.title ?? 'Announcement details'}
      description={
        data?.createdAt
          ? `Published ${formatCreatedAt(data.createdAt)}`
          : undefined
      }
      size="lg"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-4 py-2" aria-busy="true">
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        >
          <AlertCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-800">
            {error instanceof Error
              ? error.message
              : 'Failed to load announcement details.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Try again
          </Button>
        </div>
      )}

      {data && !isLoading && !isError && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {data.audiences.map((aud) => (
                <Badge key={aud} tone={AUDIENCE_TONES[aud]}>
                  {AUDIENCE_LABELS[aud]}
                </Badge>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCreatedAt(data.createdAt)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {data.message}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

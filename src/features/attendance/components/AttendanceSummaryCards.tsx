'use client';

/**
 * AttendanceSummaryCards
 *
 * Faithfully mirrors lumio-react/src/pages/AttendancePage.tsx:
 * Displays Present, Absent, Late count cards, plus ProgressRing for attendance rate.
 */

import React from 'react';
import { CheckIcon, XIcon, ClockIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/shared/Progress';
import type { ClassAttendanceSummary } from '../types';

interface AttendanceSummaryCardsProps {
  summary: ClassAttendanceSummary;
  classNameDisplay?: string;
}

export function AttendanceSummaryCards({
  summary,
  classNameDisplay = 'Class',
}: AttendanceSummaryCardsProps) {
  const total = (summary.present + summary.absent + summary.late + summary.excused) || summary.total || 0;
  const rate = total > 0 ? Math.round((summary.present / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-xl font-extrabold text-slate-900">
            {summary.present}
          </p>
          <p className="text-xs text-slate-400">Present</p>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <XIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-xl font-extrabold text-slate-900">
            {summary.absent}
          </p>
          <p className="text-xs text-slate-400">Absent</p>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <ClockIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-xl font-extrabold text-slate-900">
            {summary.late}
          </p>
          <p className="text-xs text-slate-400">Late</p>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <ProgressRing value={rate} size={48} stroke={6} tone="#10B981" trackTone="#D1FAE5">
          <span className="text-xs font-bold text-slate-700">{rate}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Today&rsquo;s rate</p>
          <p className="text-sm font-semibold text-slate-700 truncate">{classNameDisplay}</p>
        </div>
      </Card>
    </div>
  );
}

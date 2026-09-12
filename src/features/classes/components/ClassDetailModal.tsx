'use client';

/**
 * ClassDetailModal
 *
 * Detailed view for a single class, displaying student count,
 * subjects count, available seats, form teacher assignment,
 * and subjects list.
 *
 * Migrated from lumio-react ClassesPage.tsx detail modal.
 */

import { BookOpenIcon, UserIcon } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';

import { GRADE_LEVEL_LABELS } from '../constants';
import { ClassModal } from './ClassModal';
import type { ClassRecord } from '../types';

interface ClassDetailModalProps {
  open: boolean;
  onClose: () => void;
  classRecord: ClassRecord | null;
}

export function ClassDetailModal({
  open,
  onClose,
  classRecord,
}: ClassDetailModalProps) {
  if (!classRecord) return null;

  const { grade, section, capacity, room, teacher, students = 0, subjects = [] } = classRecord;
  const gradeLabel  = GRADE_LEVEL_LABELS[grade] ?? grade;
  const displayName = `${gradeLabel} ${section}`;
  const seatsLeft   = Math.max(0, capacity - students);

  return (
    <ClassModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={displayName}
      description={`Room ${room} · ${students} students`}
      size="lg"
    >
      <div className="space-y-5 p-5 sm:p-6">
        {/* 3 Metric Stat Boxes */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-center">
            <p className="font-display text-xl font-extrabold text-indigo-800">
              {students}
            </p>
            <p className="text-xs text-slate-500">Students</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-center">
            <p className="font-display text-xl font-extrabold text-purple-700">
              {subjects.length}
            </p>
            <p className="text-xs text-slate-500">Subjects</p>
          </div>
          <div className="rounded-xl bg-gold-50 p-3 text-center">
            <p className="font-display text-xl font-extrabold text-gold-600">
              {seatsLeft}
            </p>
            <p className="text-xs text-slate-500">Seats left</p>
          </div>
        </div>

        {/* Form Teacher Section */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <UserIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Form Teacher
          </p>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
            <Avatar name={teacher || 'Unassigned'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {teacher || 'Not assigned'}
              </p>
              <p className="text-xs text-slate-500">
                {teacher ? 'Active Form Teacher' : 'No teacher assigned'}
              </p>
            </div>
            {teacher ? (
              <Badge tone="green" dot>
                Active
              </Badge>
            ) : (
              <Badge tone="slate">Unassigned</Badge>
            )}
          </div>
        </div>

        {/* Subjects & Teachers Section */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <BookOpenIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Subjects & teachers
          </p>
          <div className="space-y-2">
            {subjects.length > 0 ? (
              subjects.map((subject, idx) => (
                <div
                  key={subject}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {subject}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Avatar name={`Teacher ${idx + 1}`} size="xs" />
                    Teacher {idx + 1}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No subjects assigned yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ClassModal>
  );
}

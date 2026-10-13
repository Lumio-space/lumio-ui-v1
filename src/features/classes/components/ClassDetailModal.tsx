import Link from 'next/link';
import { BookOpenIcon, UserIcon, AlertTriangleIcon, LayersIcon } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

import {
  GRADE_LEVEL_LABELS,
  SCHOOL_LEVEL_LABELS,
  DEPARTMENT_TONES,
  sectionHasDepartment,
  composeClassName,
} from '../constants';
import { Modal } from '@/components/shared/Modal';
import type { ClassRecord, SchoolLevel } from '../types';

interface ClassDetailModalProps {
  open: boolean;
  onClose: () => void;
  classRecord: ClassRecord | null;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-800">
        {children}
      </dd>
    </div>
  );
}

export function ClassDetailModal({
  open,
  onClose,
  classRecord,
}: ClassDetailModalProps) {
  if (!classRecord) return null;

  const { grade, section, level, capacity, room, teacher, formTeacher, formTeacherName, department, students = 0, subjects = [] } = classRecord;
  const displayTeacher =
    teacher ||
    formTeacherName ||
    (formTeacher && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formTeacher)
      ? formTeacher
      : undefined);
  const knownLevel = level as SchoolLevel;
  const levelLabel = SCHOOL_LEVEL_LABELS[knownLevel] ?? level;
  const gradeLabel = GRADE_LEVEL_LABELS[grade] ?? grade;
  const displayName = composeClassName(gradeLabel, department, section);
  const seatsLeft = Math.max(0, capacity - students);
  const needsDepartment = sectionHasDepartment(level) && !department;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={displayName}
      description={`Room ${room} · ${students} students`}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Department alert if Senior Secondary without department */}
        {needsDepartment && (
          <div className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-sm text-gold-700">
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
            <p>
              Department not configured. Senior Secondary classes need a Science or Arts track before subjects can be mapped correctly.
            </p>
          </div>
        )}

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

        {/* Class properties dl list matching lumio-react */}
        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
          <DetailRow label="School level">{levelLabel}</DetailRow>
          <DetailRow label="Class level">{gradeLabel}</DetailRow>
          <DetailRow label="Section">{section ?? '—'}</DetailRow>
          <DetailRow label="Department / Track">
            {sectionHasDepartment(level) ? (
              department && department !== 'Nill' ? (
                <Badge tone={DEPARTMENT_TONES[department as keyof typeof DEPARTMENT_TONES] ?? 'indigo'} dot>
                  {department}
                </Badge>
              ) : (
                <Badge tone="gold" dot>
                  Not configured
                </Badge>
              )
            ) : (
              <span className="text-slate-400">Not applicable to this level</span>
            )}
          </DetailRow>
          <DetailRow label="Room">{room ?? '—'}</DetailRow>
          <DetailRow label="Capacity">{capacity}</DetailRow>
        </dl>

        {/* Form Teacher Section */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <UserIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Form Teacher
          </p>
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl border p-3',
              displayTeacher ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-slate-200'
            )}
          >
            {displayTeacher ? (
              <>
                <Avatar name={displayTeacher} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{displayTeacher}</p>
                  <p className="text-xs text-slate-500">Assigned by the school admin</p>
                </div>
                <Badge tone="green" dot>
                  Active
                </Badge>
              </>
            ) : (
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Not assigned</p>
                  <p className="text-xs text-slate-500">
                    Teacher not assigned. Invite or assign one from the{' '}
                    <Link href="/teachers" className="font-semibold underline underline-offset-2 text-indigo-700">
                      Teachers
                    </Link>{' '}
                    section.
                  </p>
                </div>
                <Badge tone="slate">Unassigned</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Subjects & Teachers Section */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <BookOpenIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Subjects & teachers
          </p>
          {subjects.length === 0 ? (
            <EmptyState
              icon={<LayersIcon className="h-6 w-6" />}
              title="No subjects assigned yet"
              description="Assign subjects to this class from the Subjects section."
              action={
                <Link href="/subjects">
                  <Button variant="outline" size="sm">
                    Go to Subjects
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {subjects.map((subject, idx) => (
                <div
                  key={subject}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <span className="text-sm font-medium text-slate-700">{subject}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Avatar name={`Teacher ${idx + 1}`} size="xs" />
                    Teacher {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}

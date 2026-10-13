'use client';

/**
 * ClassCard
 *
 * Displays an individual class card with:
 *   - Class display name & room location (MapPinIcon)
 *   - Actions dropdown (View details, Edit, Delete)
 *   - Form Teacher avatar & status badge
 *   - Capacity student count & progress fill bar
 *   - School level and subject badges
 *   - "View class" secondary button
 *
 * Migrated from lumio-react ClassesPage.tsx.
 */

import {
  MapPinIcon,
  UsersIcon,
  BookOpenIcon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Progress } from '@/components/shared/Progress';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/shared/Dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  GRADE_LEVEL_LABELS,
  SCHOOL_LEVEL_LABELS,
  SCHOOL_LEVEL_TONES,
  DEPARTMENT_TONES,
  sectionHasDepartment,
  composeClassName,
} from '../constants';
import type { ClassRecord, SchoolLevel } from '../types';

interface ClassCardProps {
  classRecord: ClassRecord;
  onViewDetails?: (classRecord: ClassRecord) => void;
  onEdit?: (classRecord: ClassRecord) => void;
  onDelete?: (classRecord: ClassRecord) => void;
}

export function ClassCard({
  classRecord,
  onViewDetails,
  onEdit,
  onDelete,
}: ClassCardProps) {
  const { grade, section, level, capacity, room, teacher, formTeacher, formTeacherName, department, students = 0, subjects = [] } = classRecord;
  const displayTeacher =
    teacher ||
    formTeacherName ||
    (formTeacher && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formTeacher)
      ? formTeacher
      : undefined);

  // level may be any string from the DB; cast only after guard
  const knownLevel  = level as SchoolLevel;
  const levelLabel  = SCHOOL_LEVEL_LABELS[knownLevel] ?? level;
  const badgeTone   = SCHOOL_LEVEL_TONES[knownLevel] ?? 'slate';
  const gradeLabel  = GRADE_LEVEL_LABELS[grade] ?? grade;
  const hasValidDept = Boolean(department && department !== 'Nill');
  const displayName = composeClassName(gradeLabel, department, section);
  const needsDepartment = sectionHasDepartment(level) && !hasValidDept;

  const fill = capacity > 0 ? Math.min(100, Math.round((students / capacity) * 100)) : 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-card',
        'transition-shadow hover:shadow-elevated flex flex-col justify-between',
      )}
    >
      {/* Card header — indigo, matching React reference */}
      <div className="flex items-start justify-between bg-indigo-900 p-5">
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold text-white">
            {displayName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-indigo-300">
            <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Room {room}</span>
          </p>
        </div>

        {/* Dropdown actions menu */}
        <Dropdown
          trigger={
            <span
              className="inline-flex rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-800 transition-colors"
              aria-label="Class actions"
            >
              <MoreVerticalIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          }
        >
          <DropdownItem
            icon={<EyeIcon className="h-4 w-4" />}
            onClick={() => onViewDetails?.(classRecord)}
          >
            View details
          </DropdownItem>
          <DropdownItem
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => onEdit?.(classRecord)}
          >
            Edit
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            danger
            icon={<Trash2Icon className="h-4 w-4" />}
            onClick={() => onDelete?.(classRecord)}
          >
            Delete
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Class properties — level, section and department are distinct */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={badgeTone}>{levelLabel}</Badge>
          {section && (
            <Badge tone="slate">Section {section}</Badge>
          )}
          {hasValidDept && sectionHasDepartment(level) ? (
            <Badge tone={DEPARTMENT_TONES[department as keyof typeof DEPARTMENT_TONES] ?? 'indigo'} dot>
              {department}
            </Badge>
          ) : (
            needsDepartment && (
              <Badge tone="gold" dot>
                Department not configured
              </Badge>
            )
          )}
        </div>

        {/* Form Teacher row */}
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={displayTeacher || 'Unassigned'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">Form Teacher</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayTeacher || 'Not assigned'}
            </p>
          </div>
          {displayTeacher ? (
            <Badge tone="green" dot>
              Active
            </Badge>
          ) : (
            <Badge tone="slate">Unassigned</Badge>
          )}
        </div>

        {/* Capacity metric and progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-slate-500">
              <UsersIcon className="h-4 w-4" aria-hidden="true" />
              Capacity
            </span>
            <span className="font-semibold text-slate-700">
              {students}/{capacity}
            </span>
          </div>
          <Progress
            value={fill}
            tone={fill > 90 ? 'gold' : 'purple'}
            size="sm"
            label={`${displayName} capacity ${students} of ${capacity}`}
          />
        </div>

        {/* Subject count & badges */}
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <BookOpenIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {subjects.length === 0 ? (
              <span className="text-slate-400">No subjects assigned</span>
            ) : (
              <>
                <span className="font-semibold text-slate-700">
                  {subjects.length}
                </span>{' '}
                subject{subjects.length === 1 ? '' : 's'}
              </>
            )}
          </p>
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {subjects.map((s) => (
                <Badge key={s} tone="slate">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* View class button */}
        <div className="mt-auto pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => onViewDetails?.(classRecord)}
          >
            View class
          </Button>
        </div>
      </div>
    </div>
  );
}

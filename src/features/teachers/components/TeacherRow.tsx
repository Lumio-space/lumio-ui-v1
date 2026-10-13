'use client';

/**
 * TeacherRow
 *
 * List view row for an individual teacher.
 */

import React from 'react';
import { MoreVerticalIcon, EyeIcon, Trash2Icon, PowerIcon } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from '@/components/shared/Dropdown';
import { FormTeacherBadge } from './FormTeacherBadge';
import { assignmentForTeacher } from '../constants';
import type { TeacherRecord, TeacherInvitation } from '../types';

interface TeacherRowProps {
  teacher: TeacherRecord;
  invitations: TeacherInvitation[];
  onView: () => void;
  onRemove?: () => void;
  onToggleStatus?: () => void;
}

export function TeacherRow({
  teacher,
  invitations,
  onView,
  onRemove,
  onToggleStatus,
}: TeacherRowProps) {
  const teacherName = teacher.fullName || teacher.name || 'Teacher';
  const assignment = assignmentForTeacher(invitations, teacher);
  const subjects = teacher.subjects?.map((s) => s.title) || [];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:border-slate-200">
      <Avatar name={teacherName} src={teacher.avatar} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800">{teacherName}</p>
          {teacher.email && (
            <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[200px]">
              {teacher.email}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-400">
          {subjects.length > 0 ? subjects.join(', ') : 'No subjects assigned'}
        </p>
      </div>

      <FormTeacherBadge
        invite={assignment}
        className="hidden lg:inline-flex"
      />

      {teacher.department && (
        <Badge tone="slate" className="hidden sm:inline-flex">
          {teacher.department}
        </Badge>
      )}

      <Dropdown
        trigger={
          <span className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <MoreVerticalIcon className="h-4 w-4" />
          </span>
        }
      >
        <DropdownItem icon={<EyeIcon className="h-4 w-4" />} onClick={onView}>
          View profile
        </DropdownItem>
        {onToggleStatus && (
          <DropdownItem
            icon={<PowerIcon className="h-4 w-4" />}
            onClick={onToggleStatus}
          >
            {teacher.status === 'active' ? 'Mark inactive' : 'Mark active'}
          </DropdownItem>
        )}
        {onRemove && (
          <>
            <DropdownDivider />
            <DropdownItem
              danger
              icon={<Trash2Icon className="h-4 w-4" />}
              onClick={onRemove}
            >
              Remove
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  );
}

'use client';

import React from 'react';
import {
  MoreVerticalIcon,
  EyeIcon,
  Trash2Icon,
} from 'lucide-react';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Progress } from '@/components/shared/Progress';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from '@/components/shared/Dropdown';
import { studentStatusTone } from '../constants';
import type { StudentRecord } from '../types';

interface StudentTableProps {
  students: StudentRecord[];
  onSelect: (student: StudentRecord) => void;
  onDelete?: (student: StudentRecord) => void;
}

export function StudentTable({
  students,
  onSelect,
  onDelete,
}: StudentTableProps) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Student</TH>
          <TH className="hidden md:table-cell">Class</TH>
          <TH className="hidden lg:table-cell">Attendance</TH>
          <TH className="hidden sm:table-cell">Average</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </tr>
      </THead>
      <tbody>
        {students.map((s) => (
          <TR
            key={s.id}
            className="cursor-pointer"
            onClick={() => onSelect(s)}
          >
            <TD>
              <div className="flex items-center gap-3">
                <Avatar name={s.name} src={s.avatar} size="sm" />
                <div>
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.admissionNo}</p>
                </div>
              </div>
            </TD>
            <TD className="hidden md:table-cell text-sm text-slate-600">
              {s.grade || '—'}
              {s.section ? ` · ${s.section}` : ''}
            </TD>
            <TD className="hidden lg:table-cell">
              <div className="flex w-32 items-center gap-2">
                <Progress
                  value={s.attendance}
                  tone={s.attendance >= 85 ? 'green' : 'gold'}
                  size="sm"
                />
                <span className="text-xs font-semibold text-slate-500">
                  {s.attendance}%
                </span>
              </div>
            </TD>
            <TD className="hidden sm:table-cell font-semibold text-slate-700">
              {s.average}%
            </TD>
            <TD>
              <Badge tone={studentStatusTone[s.status]} dot>
                {s.status}
              </Badge>
            </TD>
            <TD
              className="text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <Dropdown
                trigger={
                  <button
                    type="button"
                    aria-label="Student actions"
                    className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                  </button>
                }
              >
                <DropdownItem
                  icon={<EyeIcon className="h-4 w-4" />}
                  onClick={() => onSelect(s)}
                >
                  View profile
                </DropdownItem>
                {onDelete && (
                  <>
                    <DropdownDivider />
                    <DropdownItem
                      danger
                      icon={<Trash2Icon className="h-4 w-4" />}
                      onClick={() => onDelete(s)}
                    >
                      Remove
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}

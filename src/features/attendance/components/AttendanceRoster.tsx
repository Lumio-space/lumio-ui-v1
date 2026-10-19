'use client';

/**
 * AttendanceRoster
 *
 * Faithfully mirrors lumio-react/src/pages/AttendancePage.tsx:
 * Student roster with avatars, roll numbers, segmented toggle buttons
 * (Present, Late, Absent, Excused), Mark All Present action, and Save button.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  XIcon,
  ClockIcon,
  ShieldCheckIcon,
  SaveIcon,
  CheckCheckIcon,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import type {
  AttendanceStatus,
  StudentAttendanceRow,
  ClassAttendanceSummary,
} from '../types';

interface AttendanceRosterProps {
  students: StudentAttendanceRow[];
  date: string;
  classNameDisplay: string;
  onSave: (marks: Record<string, AttendanceStatus>) => Promise<void>;
  isSaving: boolean;
  onSummaryChange?: (summary: ClassAttendanceSummary) => void;
}

export function AttendanceRoster({
  students,
  date,
  classNameDisplay,
  onSave,
  isSaving,
  onSummaryChange,
}: AttendanceRosterProps) {
  // Initialize marks from server student records (default to 'present' if null)
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initialMarks: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      initialMarks[s.studentId] = s.status || 'present';
    });
    setMarks(initialMarks);
    setSaved(false);
  }, [students]);

  // Compute live summary from marks
  useEffect(() => {
    const summary: ClassAttendanceSummary = {
      present: Object.values(marks).filter((m) => m === 'present').length,
      absent: Object.values(marks).filter((m) => m === 'absent').length,
      late: Object.values(marks).filter((m) => m === 'late').length,
      excused: Object.values(marks).filter((m) => m === 'excused').length,
      total: students.length,
    };
    onSummaryChange?.(summary);
  }, [marks, students.length, onSummaryChange]);

  function setMark(studentId: string, status: AttendanceStatus) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setSaved(false);
  }

  function handleMarkAllPresent() {
    const allPresent: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      allPresent[s.studentId] = 'present';
    });
    setMarks(allPresent);
    setSaved(false);
  }

  async function handleSaveClick() {
    await onSave(marks);
    setSaved(true);
  }

  const buttons: {
    status: AttendanceStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    on: string;
    off: string;
  }[] = [
    {
      status: 'present',
      label: 'Present',
      icon: CheckIcon,
      on: 'bg-emerald-500 text-white shadow-xs',
      off: 'text-emerald-600 hover:bg-emerald-50',
    },
    {
      status: 'late',
      label: 'Late',
      icon: ClockIcon,
      on: 'bg-amber-400 text-indigo-950 font-bold shadow-xs',
      off: 'text-amber-500 hover:bg-amber-50',
    },
    {
      status: 'absent',
      label: 'Absent',
      icon: XIcon,
      on: 'bg-red-500 text-white shadow-xs',
      off: 'text-red-500 hover:bg-red-50',
    },
    {
      status: 'excused',
      label: 'Excused',
      icon: ShieldCheckIcon,
      on: 'bg-indigo-600 text-white shadow-xs',
      off: 'text-indigo-600 hover:bg-indigo-50',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Class Attendance Register</CardTitle>
          <CardDescription>
            {classNameDisplay} · {date}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleMarkAllPresent}
            disabled={students.length === 0 || isSaving}
            leftIcon={<CheckCheckIcon className="h-4 w-4" />}
          >
            Mark all present
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={students.length === 0 || isSaving}
            loading={isSaving}
            variant={saved ? 'secondary' : 'default'}
            leftIcon={
              saved ? (
                <CheckIcon className="h-4 w-4 text-emerald-600" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )
            }
            onClick={handleSaveClick}
          >
            {saved ? 'Saved' : 'Save register'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No students enrolled in this class roster.
          </div>
        ) : (
          students.map((s) => (
            <div
              key={s.studentId}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 transition-colors"
            >
              <Avatar name={s.name} src={s.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {s.name}
                </p>
                <p className="text-xs text-slate-400">
                  {s.rollNo ? `Roll #${s.rollNo}` : 'Student'}
                </p>
              </div>

              {/* Status Segmented Buttons */}
              <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
                {buttons.map((b) => {
                  const isSelected = marks[s.studentId] === b.status;
                  return (
                    <button
                      key={b.status}
                      type="button"
                      onClick={() => setMark(s.studentId, b.status)}
                      aria-label={`Mark ${s.name} ${b.label}`}
                      aria-pressed={isSelected}
                      title={b.label}
                      className={cn(
                        'flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                        isSelected
                          ? b.on
                          : cn('bg-transparent', b.off)
                      )}
                    >
                      <b.icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

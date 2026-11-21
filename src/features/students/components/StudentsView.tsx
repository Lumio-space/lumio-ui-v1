'use client';

import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  UsersIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { InviteStudentModal } from '@/features/invitations/components/InviteStudentModal';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { cn } from '@/lib/utils';
import { useStudents, useRemoveStudent } from '../hooks';
import { DEFAULT_GRADES } from '../constants';
import type { StudentRecord } from '../types';
import { StudentTable } from './StudentTable';
import { StudentDetailModal } from './StudentDetailModal';

export function StudentsView() {
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: studentsResponse, isLoading, isError, error, refetch } = useStudents();
  const removeMutation = useRemoveStudent();

  const { data: rawClasses = [] } = useClasses();
  const classesList: ClassRecord[] = Array.isArray(rawClasses)
    ? rawClasses
    : (rawClasses as any)?.data || (rawClasses as any)?.classes || [];

  const allStudents = useMemo(() => {
    return studentsResponse?.data || [];
  }, [studentsResponse]);

  // Derived filter options from active classes
  const availableGrades = useMemo(() => {
    if (classesList.length > 0) {
      const uniqueGrades = Array.from(
        new Set(
          classesList.map((c) => GRADE_LEVEL_LABELS[c.grade] ?? c.grade)
        )
      ).filter(Boolean);
      return uniqueGrades.length > 0 ? uniqueGrades : DEFAULT_GRADES;
    }
    return DEFAULT_GRADES;
  }, [classesList]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q);

      const matchG =
        gradeFilter === 'all' ||
        s.grade.toLowerCase() === gradeFilter.toLowerCase() ||
        s.className?.toLowerCase().includes(gradeFilter.toLowerCase());

      const matchS =
        statusFilter === 'all' ||
        s.status.toLowerCase() === statusFilter.toLowerCase();

      return matchQ && matchG && matchS;
    });
  }, [allStudents, query, gradeFilter, statusFilter]);

  // Computed summary metrics
  const metrics = useMemo(() => {
    const total = allStudents.length;
    const active = allStudents.filter((s) => s.status === 'Active').length;

    const avgAttendance =
      total > 0
        ? Math.round(
            allStudents.reduce((acc, curr) => acc + curr.attendance, 0) / total
          )
        : 0;

    const avgScore =
      total > 0
        ? Math.round(
            allStudents.reduce((acc, curr) => acc + curr.average, 0) / total
          )
        : 0;

    return { total, active, avgAttendance, avgScore };
  }, [allStudents]);

  function handleExportCSV() {
    if (filteredStudents.length === 0) return;

    const headers = [
      'Admission No',
      'Full Name',
      'Class',
      'Section',
      'Roll No',
      'Status',
      'Attendance %',
      'Average Score %',
      'Parent / Guardian',
      'Parent Phone',
      'Student Email',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.admissionNo}"`,
      `"${s.name}"`,
      `"${s.grade}"`,
      `"${s.section}"`,
      `"${s.rollNo}"`,
      `"${s.status}"`,
      `"${s.attendance}%"`,
      `"${s.average}%"`,
      `"${s.parent}"`,
      `"${s.parentPhone}"`,
      `"${s.email}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;
    setActionError(null);
    try {
      await removeMutation.mutateAsync(studentToDelete.id);
      setStudentToDelete(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove student';
      setActionError(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student directory, profiles and academic records."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<DownloadIcon className="h-4 w-4" />}
              className="hidden sm:inline-flex"
              onClick={handleExportCSV}
              disabled={filteredStudents.length === 0}
            >
              Export
            </Button>
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setInviteOpen(true)}
            >
              Add student
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards matching lumio-react */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total',
            value: metrics.total,
            tone: 'indigo',
          },
          {
            label: 'Active',
            value: metrics.active,
            tone: 'green',
          },
          {
            label: 'Avg attendance',
            value: `${metrics.avgAttendance}%`,
            tone: 'purple',
          },
          {
            label: 'Avg score',
            value: `${metrics.avgScore}%`,
            tone: 'gold',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card"
          >
            <p className="text-xs font-medium text-slate-400">{c.label}</p>
            <p
              className={cn(
                'mt-1 font-display text-2xl font-extrabold',
                c.tone === 'green'
                  ? 'text-emerald-600'
                  : c.tone === 'purple'
                  ? 'text-purple-600'
                  : c.tone === 'gold'
                  ? 'text-gold-500'
                  : 'text-indigo-800'
              )}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Student Directory Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or admission no…"
              aria-label="Search students"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Filter by grade"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 transition-colors focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 sm:w-40"
            >
              <option value="all">All grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 transition-colors focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 sm:w-40"
            >
              <option value="all">All status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
        </div>

        {/* Directory Content States */}
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading student directory...
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="font-semibold text-slate-800">
              Failed to load students
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="No students found"
            description={
              query || gradeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No students have been registered yet. Click "Add student" to invite your first student.'
            }
            action={
              query || gradeFilter !== 'all' || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setGradeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => setInviteOpen(true)}
                >
                  Add student
                </Button>
              )
            }
          />
        ) : (
          <StudentTable
            students={filteredStudents}
            onSelect={(student) => setDetailStudent(student)}
            onDelete={(student) => {
              setActionError(null);
              setStudentToDelete(student);
            }}
          />
        )}
      </div>

      {/* Invite Student Modal (reusing existing tested Next.js invite workflow) */}
      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvitationCreated={() => {
          refetch();
        }}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        open={Boolean(detailStudent)}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
      />

      {/* Remove Confirmation Modal */}
      <Modal
        open={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        title="Remove student"
        description="Are you sure you want to remove this student? This will remove them from the school directory."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setStudentToDelete(null)}
              disabled={removeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={removeMutation.isPending}
            >
              Remove
            </Button>
          </div>
        }
      >
        {actionError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        <p className="text-sm text-slate-600">
          Student:{' '}
          <span className="font-semibold text-slate-800">
            {studentToDelete?.name}
          </span>{' '}
          ({studentToDelete?.admissionNo})
        </p>
      </Modal>
    </div>
  );
}

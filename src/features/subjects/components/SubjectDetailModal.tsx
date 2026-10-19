'use client';

/**
 * SubjectDetailModal
 *
 * Migrated from lumio-react src/components/subjects/SubjectDetail.tsx.
 * Provides deep visibility into a subject: overview metrics, class offerings,
 * and teacher allocations.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  LayersIcon,
  UserPlusIcon,
  AlertTriangleIcon,
  MoreVerticalIcon,
  EyeIcon,
  RefreshCwIcon,
  Trash2Icon,
  BookOpenIcon,
  GraduationCapIcon,
  CalendarIcon,
} from 'lucide-react';

import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Tabs } from '@/components/shared/Tabs';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from '@/components/shared/Dropdown';

import {
  sectionTone,
  sectionHasDepartment,
  subjectDepartmentTone,
  departmentTone,
} from '../constants';
import type { SubjectRecord, SubjectOffering } from '../types';
import type { ClassRecord } from '@/features/classes/types';
import type { TeacherOption } from './AssignTeacherModal';
import { GRADE_LEVEL_LABELS, composeClassName } from '@/features/classes/constants';

interface SubjectDetailModalProps {
  subject: SubjectRecord | null;
  offerings: SubjectOffering[];
  classes: ClassRecord[];
  teachers: TeacherOption[];
  onClose: () => void;
  onAssignClasses: () => void;
  onAssignTeacher: (offering: SubjectOffering) => void;
  onRemoveOffering: (offeringId: string) => void;
  onDelete?: (subject: SubjectRecord) => void;
  onEdit?: (subject: SubjectRecord) => void;
}


export function SubjectDetailModal({
  subject,
  offerings,
  classes,
  teachers,
  onClose,
  onAssignClasses,
  onAssignTeacher,
  onRemoveOffering,
  onDelete,
  onEdit,
}: SubjectDetailModalProps) {
  const [tab, setTab] = useState('overview');

  if (!subject) return null;

  const subjectOfferings = offerings.filter((o) => o.subjectId === subject.id);
  const unassigned = subjectOfferings.filter((o) => o.teacherIds.length === 0);

  // Distinct teachers taking this subject
  const assignedTeacherIds = new Set<string>();
  subjectOfferings.forEach((o) => o.teacherIds.forEach((t) => assignedTeacherIds.add(t)));
  const assignedTeachers = teachers.filter((t) => assignedTeacherIds.has(t.id));

  // Total students reached
  const totalStudents = subjectOfferings.reduce((sum, o) => {
    const cls = classes.find((c) => c.id === o.classId);
    return sum + (cls?.students ?? 0);
  }, 0);

  return (
    <Modal
      open={!!subject}
      onClose={onClose}
      title={subject.name}
      description={`${subject.code} · ${subject.section}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          {onDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(subject);
                onClose();
              }}
            >
              <Trash2Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Delete subject
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(subject);
                }}
              >
                Edit subject
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >

      {/* Identity strip */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={sectionTone[subject.section]}>{subject.section}</Badge>
        {sectionHasDepartment(subject.section) &&
          (subject.department ? (
            <Badge tone={subjectDepartmentTone(subject.department)}>
              {subject.department}
            </Badge>
          ) : (
            <Badge tone="gold" dot>
              Department not configured
            </Badge>
          ))}
        {sectionHasDepartment(subject.section) &&
          (subject.type ? (
            <Badge tone="slate">{subject.type}</Badge>
          ) : (
            <Badge tone="gold" dot>
              Subject type not configured
            </Badge>
          ))}
        <Badge tone={subject.status === 'Active' ? 'green' : 'slate'} dot>
          {subject.status}
        </Badge>
        {unassigned.length > 0 && (
          <Badge tone="gold" dot>
            {unassigned.length} class{unassigned.length === 1 ? '' : 'es'} without a teacher
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 border-b border-slate-100">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            {
              id: 'classes',
              label: 'Classes',
              count: subjectOfferings.length || undefined,
            },
            {
              id: 'teachers',
              label: 'Teachers',
              count: assignedTeachers.length || undefined,
            },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="pt-5">
        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-indigo-50 p-3 text-center">
                <p className="font-display text-xl font-extrabold text-indigo-800">
                  {subjectOfferings.length}
                </p>
                <p className="text-xs text-slate-500">Classes offering</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <p className="font-display text-xl font-extrabold text-purple-700">
                  {assignedTeachers.length}
                </p>
                <p className="text-xs text-slate-500">Teachers assigned</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="font-display text-xl font-extrabold text-slate-800">
                  {totalStudents}
                </p>
                <p className="text-xs text-slate-500">Students reached</p>
              </div>
              <div className="rounded-xl bg-gold-50 p-3 text-center">
                <p className="font-display text-xl font-extrabold text-gold-600">
                  {unassigned.length}
                </p>
                <p className="text-xs text-slate-500">Needs a teacher</p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <BookOpenIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Subject code</dt>
                  <dd className="text-sm font-semibold text-slate-700">
                    {subject.code}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <GraduationCapIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">School section</dt>
                  <dd className="text-sm font-semibold text-slate-700">
                    {subject.section}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <LayersIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Department / Subject type</dt>
                  <dd className="text-sm font-semibold text-slate-700">
                    {sectionHasDepartment(subject.section)
                      ? [
                          subject.department ?? 'Department not configured',
                          subject.type ?? 'Subject type not configured',
                        ].join(' · ')
                      : 'Not applicable to this section'}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Created</dt>
                  <dd className="text-sm font-semibold text-slate-700">
                    {subject.createdOn}
                  </dd>
                </div>
              </div>
            </dl>

            {subject.status === 'Inactive' && (
              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p>
                  This subject is inactive. It cannot be added to new classes, but
                  it stays on past results and records.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Classes Tab ── */}
        {tab === 'classes' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Each row is one offering — {subject.name} in that class. Teachers
                are assigned per offering.
              </p>
              <Button
                size="sm"
                leftIcon={<LayersIcon className="h-4 w-4" />}
                onClick={onAssignClasses}
              >
                Assign to classes
              </Button>
            </div>

            {subjectOfferings.length === 0 ? (
              <EmptyState
                icon={<LayersIcon className="h-6 w-6" />}
                title="Not offered by any class yet"
                description="Choose the classes that will offer this subject, then assign a teacher to each one."
                action={
                  <Button
                    leftIcon={<LayersIcon className="h-4 w-4" />}
                    onClick={onAssignClasses}
                  >
                    Assign to classes
                  </Button>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <Table>
                  <THead>
                    <tr>
                      <TH>Class</TH>
                      <TH className="hidden sm:table-cell">Students</TH>
                      <TH>Teacher</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Actions</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {subjectOfferings.map((o) => {
                      const cls = classes.find((c) => c.id === o.classId);
                      const gradeLabel = cls ? (GRADE_LEVEL_LABELS[cls.grade] ?? cls.grade) : '';
                      const classNameDisplay = cls
                        ? composeClassName(gradeLabel, cls.department, cls.section)
                        : 'Class';
                      const teacher = teachers.find((t) => t.id === o.teacherIds[0]);

                      return (
                        <TR key={o.id}>
                          <TD>
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-800">
                                {classNameDisplay}
                              </span>
                              {cls?.department && cls.department !== 'Nill' && (
                                <Badge tone={departmentTone[cls.department as keyof typeof departmentTone] ?? 'indigo'}>
                                  {cls.department}
                                </Badge>
                              )}
                            </span>
                          </TD>
                          <TD className="hidden sm:table-cell text-slate-500">
                            {cls?.students ?? 0}
                          </TD>
                          <TD>
                            {teacher ? (
                              <span className="flex items-center gap-2">
                                <Avatar name={teacher.name} size="xs" />
                                <span className="text-sm font-medium text-slate-700">
                                  {teacher.name}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAssignTeacher(o)}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
                              >
                                <UserPlusIcon className="h-4 w-4" />
                                Assign teacher
                              </button>
                            )}
                          </TD>
                          <TD>
                            {teacher ? (
                              <Badge tone="green" dot>
                                Configured
                              </Badge>
                            ) : (
                              <Badge tone="gold" dot>
                                Not assigned
                              </Badge>
                            )}
                          </TD>
                          <TD>
                            <div className="flex justify-end">
                              <Dropdown
                                trigger={
                                  <button
                                    type="button"
                                    aria-label={`Actions for ${subject.name} in ${classNameDisplay}`}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <MoreVerticalIcon className="h-4 w-4" />
                                  </button>
                                }
                              >
                                <DropdownItem
                                  icon={<RefreshCwIcon className="h-4 w-4" />}
                                  onClick={() => onAssignTeacher(o)}
                                >
                                  {teacher ? 'Change teacher' : 'Assign teacher'}
                                </DropdownItem>
                                <DropdownItem icon={<EyeIcon className="h-4 w-4" />}>
                                  <Link href="/classes">View class</Link>
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem
                                  icon={<Trash2Icon className="h-4 w-4" />}
                                  danger
                                  onClick={() => onRemoveOffering(o.id)}
                                >
                                  Remove from class
                                </DropdownItem>
                              </Dropdown>
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Teachers Tab ── */}
        {tab === 'teachers' && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Teachers taking {subject.name}, and the classes they take it in.
            </p>
            {assignedTeachers.length === 0 ? (
              <EmptyState
                icon={<UserPlusIcon className="h-6 w-6" />}
                title="No teachers assigned yet"
                description="Assign a teacher to each class offering to complete this subject's setup."
                action={
                  <Button variant="outline" onClick={() => setTab('classes')}>
                    Go to classes
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {assignedTeachers.map((t) => {
                  const mine = subjectOfferings.filter((o) =>
                    o.teacherIds.includes(t.id)
                  );
                  const totalOfferings = offerings.filter((o) =>
                    o.teacherIds.includes(t.id)
                  ).length;

                  return (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-4"
                    >
                      <Avatar name={t.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {totalOfferings} offering{totalOfferings === 1 ? '' : 's'} across all subjects
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mine.map((o) => {
                          const cls = classes.find((c) => c.id === o.classId);
                          const gradeLabel = cls ? (GRADE_LEVEL_LABELS[cls.grade] ?? cls.grade) : '';
                          const cName = cls ? composeClassName(gradeLabel, cls.department, cls.section) : 'Class';
                          return (
                            <Badge key={o.id} tone="indigo">
                              {cName}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {unassigned.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-gold-50 p-4">
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-gold-500" />
                <p className="min-w-0 flex-1 text-sm text-gold-700">
                  {unassigned.length} class{unassigned.length === 1 ? '' : 'es'} still need a teacher for this subject.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTab('classes')}
                >
                  Review
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

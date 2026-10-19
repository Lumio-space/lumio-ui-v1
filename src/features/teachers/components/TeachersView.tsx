'use client';

/**
 * TeachersView
 *
 * Full Teacher Dashboard & Invitation management view.
 * Migrated from lumio-react/src/pages/TeachersPage.tsx.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  PlusIcon,
  SearchIcon,
  MailIcon,
  UsersIcon,
  ClipboardCheckIcon,
  LayoutGridIcon,
  ListIcon,
  RefreshCwIcon,
  XIcon,
  CheckIcon,
  AlertTriangleIcon,
  SchoolIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Tabs } from '@/components/shared/Tabs';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import { EmptyState } from '@/components/shared/EmptyState';
import { NativeSelect } from '@/components/shared/NativeSelect';
import { cn } from '@/lib/utils';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import {
  INVITE_FILTERS,
  inviteStatusTone,
  assignmentLabel,
  formTeacherForClass,
  DEPARTMENTS,
} from '../constants';
import {
  useTeachers,
  useInvitations,
  useInviteTeacher,
  useRemoveTeacher,
  useUpdateTeacherStatus,
} from '../hooks';
import { TeacherCard } from './TeacherCard';
import { TeacherRow } from './TeacherRow';
import { TeacherDetailModal } from './TeacherDetailModal';
import { InviteTeacherModal } from './InviteTeacherModal';
import { AssignFormTeacherModal } from './AssignFormTeacherModal';
import { AssignTeacherSubjectModal } from './AssignTeacherSubjectModal';
import { Modal } from '@/components/shared/Modal';
import type {
  TeacherRecord,
  TeacherInvitation,
  InviteStatus,
} from '../types';

export function TeachersView() {
  const searchParams = useSearchParams();
  const initialInviteParam = searchParams.get('invite') === 'true' || searchParams.get('action') === 'invite';
  const initialTabParam = searchParams.get('tab') || 'directory';

  const [tab, setTab] = useState(initialTabParam);
  const { data: rawTeachers, isLoading: teachersLoading } = useTeachers();
  const { data: rawClasses, isLoading: classesLoading } = useClasses();
  const {
    invitations,
    addInvitation,
    resendInvitation,
    revokeInvitation,
    syncWithBackend,
  } = useInvitations();

  const inviteMutation = useInviteTeacher();
  const removeMutation = useRemoveTeacher();
  const updateStatusMutation = useUpdateTeacherStatus();

  // Normalize teachers and classes as safe arrays
  const teachers: TeacherRecord[] = useMemo(() => {
    if (Array.isArray(rawTeachers)) return rawTeachers;
    if (rawTeachers && typeof rawTeachers === 'object') {
      const anyData = rawTeachers as { data?: unknown; teachers?: unknown; items?: unknown };
      if (Array.isArray(anyData.data)) return anyData.data as TeacherRecord[];
      if (Array.isArray(anyData.teachers)) return anyData.teachers as TeacherRecord[];
      if (Array.isArray(anyData.items)) return anyData.items as TeacherRecord[];
    }
    return [];
  }, [rawTeachers]);

  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    if (rawClasses && typeof rawClasses === 'object') {
      const anyData = rawClasses as { data?: unknown; classes?: unknown; items?: unknown };
      if (Array.isArray(anyData.data)) return anyData.data as ClassRecord[];
      if (Array.isArray(anyData.classes)) return anyData.classes as ClassRecord[];
      if (Array.isArray(anyData.items)) return anyData.items as ClassRecord[];
    }
    return [];
  }, [rawClasses]);

  // Sync invitation statuses with actual backend teachers and classes
  useEffect(() => {
    if (teachers.length > 0 || classes.length > 0) {
      syncWithBackend?.(teachers, classes);
    }
  }, [teachers, classes, syncWithBackend]);

  // Directory state
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [detailTeacher, setDetailTeacher] = useState<TeacherRecord | null>(null);
  const [assignFormTeacherTarget, setAssignFormTeacherTarget] = useState<TeacherRecord | null>(null);
  const [assignClassTarget, setAssignClassTarget] = useState<ClassRecord | null>(null);
  const [assignSubjectTarget, setAssignSubjectTarget] = useState<TeacherRecord | null>(null);

  // Invitation state
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteFilter, setInviteFilter] = useState<InviteStatus | 'All'>('All');
  const [resentId, setResentId] = useState<string | null>(null);
  const [cancelTargetInvite, setCancelTargetInvite] = useState<TeacherInvitation | null>(null);


  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(initialInviteParam);
  const [wizardClassId, setWizardClassId] = useState<string | undefined>(undefined);
  const [wizardStep, setWizardStep] = useState(1);

  // Auto-open invite modal if query param changes
  const [prevInitialInvite, setPrevInitialInvite] = useState(initialInviteParam);
  if (initialInviteParam !== prevInitialInvite) {
    setPrevInitialInvite(initialInviteParam);
    if (initialInviteParam) {
      setWizardOpen(true);
    }
  }

  const departments = useMemo(() => {
    if (!Array.isArray(teachers)) return DEPARTMENTS;
    const fromTeachers = teachers
      .map((t) => t.department)
      .filter((d): d is string => Boolean(d));
    return Array.from(new Set([...DEPARTMENTS, ...fromTeachers]));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter((t) => {
      const q = query.toLowerCase().trim();
      const name = (t.fullName || t.name || '').toLowerCase();
      const subjectsStr = (t.subjects || []).map((s) => s.title).join(' ').toLowerCase();
      const matchesQ = !q || name.includes(q) || subjectsStr.includes(q);
      const matchesD = dept === 'all' || t.department === dept;
      return matchesQ && matchesD;
    });
  }, [teachers, query, dept]);

  const filteredInvites = useMemo(() => {
    return invitations.filter((i) => {
      const q = inviteQuery.trim().toLowerCase();
      const matchesQ =
        !q ||
        (i.name ? i.name.toLowerCase().includes(q) : false) ||
        i.email.toLowerCase().includes(q) ||
        (i.className ? i.className.toLowerCase().includes(q) : false);
      const matchesF = inviteFilter === 'All' || i.status === inviteFilter;
      return matchesQ && matchesF;
    });
  }, [invitations, inviteQuery, inviteFilter]);

  const pendingCount = invitations.filter((i) => i.status === 'Pending').length;
  const expiredCount = invitations.filter((i) => i.status === 'Expired').length;

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    return composeClassName(gradeLabel, c.department, c.section);
  };

  function openWizard() {
    setWizardOpen(true);
  }

  async function handleResend(invite: TeacherInvitation) {
    try {
      setResentId(invite.id);
      await inviteMutation.mutateAsync({
        email: invite.email,
        classId: invite.classId,
      });
      resendInvitation(invite.id);
      setTimeout(() => setResentId(null), 2000);
    } catch {
      setResentId(null);
    }
  }

  function handleRemoveTeacher(teacher: TeacherRecord) {
    if (window.confirm(`Are you sure you want to remove ${teacher.fullName || teacher.name || 'this teacher'}?`)) {
      removeMutation.mutate(teacher.userId || teacher.id);
    }
  }

  function handleToggleStatus(teacher: TeacherRecord) {
    const nextStatus = teacher.status === 'active' ? 'suspended' : 'active';
    const teacherId = teacher.userId || teacher.id;
    updateStatusMutation.mutate(
      { teacherId, status: nextStatus },
      {
        onSuccess: () => {
          if (detailTeacher && (detailTeacher.id === teacher.id || detailTeacher.userId === teacher.userId)) {
            setDetailTeacher((prev) => (prev ? { ...prev, status: nextStatus } : null));
          }
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and invite teachers to lead existing classes."
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => openWizard()}
          >
            Invite teacher
          </Button>
        }
      />

      {/* Main Content Card with Tabs */}
      <Card className="p-0 overflow-hidden bg-white shadow-card">
        <div className="px-4 pt-2 sm:px-6">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              {
                id: 'directory',
                label: 'Teachers',
                icon: <UsersIcon className="h-4 w-4" />,
              },
              {
                id: 'invitations',
                label: `Invitations${pendingCount ? ` (${pendingCount})` : ''}`,
                icon: <MailIcon className="h-4 w-4" />,
              },
              {
                id: 'assignments',
                label: 'Class assignments',
                icon: <ClipboardCheckIcon className="h-4 w-4" />,
              },
            ]}
          />
        </div>

        {/* ------------------------------- Directory Tab ------------------------------- */}
        {tab === 'directory' && (
          <div>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search teachers or subjects…"
                  aria-label="Search teachers"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="sm:w-48">
                <NativeSelect
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  aria-label="Filter by department"
                >
                  <option value="all">All departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex rounded-xl border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'rounded-lg p-1.5 transition-colors',
                    view === 'grid'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={cn(
                    'rounded-lg p-1.5 transition-colors',
                    view === 'list'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {teachersLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-48 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : filteredTeachers.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon className="h-6 w-6" />}
                  title="No teachers found"
                  description={
                    query || dept !== 'all'
                      ? 'No teachers match your search filters.'
                      : 'Invite teachers to build your faculty and assign them to lead classes.'
                  }
                  action={
                    <Button
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                      onClick={() => openWizard()}
                    >
                      Invite teacher
                    </Button>
                  }
                />
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTeachers.map((t, i) => (
                    <TeacherCard
                      key={t.id}
                      teacher={t}
                      invitations={invitations}
                      index={i}
                      onClick={() => setDetailTeacher(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTeachers.map((t) => (
                    <TeacherRow
                      key={t.id}
                      teacher={t}
                      invitations={invitations}
                      onView={() => setDetailTeacher(t)}
                      onRemove={() => handleRemoveTeacher(t)}
                      onToggleStatus={() => handleToggleStatus(t)}
                      onAssignFormTeacher={() => setAssignFormTeacherTarget(t)}
                      onAssignSubject={() => setAssignSubjectTarget(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------- Invitations Tab ------------------------------- */}
        {tab === 'invitations' && (
          <div>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  placeholder="Search by teacher, email or class…"
                  aria-label="Search invitations"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {INVITE_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setInviteFilter(f)}
                    aria-pressed={inviteFilter === f}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      inviteFilter === f
                        ? 'bg-white text-indigo-800 shadow-soft'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {expiredCount > 0 && (
              <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-700">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                <span>
                  {expiredCount} invitation{expiredCount === 1 ? '' : 's'} expired and
                  can be resent.
                </span>
              </div>
            )}

            {filteredInvites.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<MailIcon className="h-6 w-6" />}
                  title="No invitations found"
                  description="Invite a teacher to lead one of your existing classes."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                      onClick={() => openWizard()}
                    >
                      Invite teacher
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Teacher</TH>
                    <TH>Class</TH>
                    <TH className="hidden xl:table-cell">Sent</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Action</TH>
                  </tr>
                </THead>
                <tbody>
                  {filteredInvites.map((invite) => {
                    let formattedSent = 'N/A';
                    try {
                      formattedSent = format(new Date(invite.sent), 'MMM d, yyyy');
                    } catch {
                      formattedSent = invite.sent;
                    }

                    return (
                      <TR key={invite.id}>
                        <TD>
                          <div className="flex items-center gap-3">
                            <Avatar name={invite.name || invite.email} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {invite.name || invite.email}
                              </p>
                              {invite.name && invite.name !== invite.email && (
                                <p className="truncate text-xs text-slate-400">
                                  {invite.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD>
                          {(() => {
                            const targetClass = classes.find((c) => c.id === invite.classId);
                            const classDisplayName = targetClass ? formatClassName(targetClass) : invite.className;
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge tone="indigo">{classDisplayName}</Badge>
                                {targetClass?.department && targetClass.department !== 'Nill' && (
                                  <Badge
                                    tone={
                                      DEPARTMENT_TONES[
                                        targetClass.department as keyof typeof DEPARTMENT_TONES
                                      ] ?? 'indigo'
                                    }
                                  >
                                    {targetClass.department}
                                  </Badge>
                                )}
                              </div>
                            );
                          })()}
                        </TD>
                        <TD className="hidden xl:table-cell text-slate-400">
                          {formattedSent}
                        </TD>
                        <TD>
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              tone={inviteStatusTone[invite.status]}
                              dot
                              className="w-fit"
                            >
                              {invite.status}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {assignmentLabel(invite.status)}
                            </span>
                          </div>
                        </TD>
                        <TD>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Resend button */}
                            {invite.status !== 'Accepted' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={
                                  <RefreshCwIcon
                                    className={cn(
                                      'h-3.5 w-3.5',
                                      resentId === invite.id && 'animate-spin'
                                    )}
                                  />
                                }
                                onClick={() => handleResend(invite)}
                                disabled={resentId === invite.id}
                              >
                                {resentId === invite.id ? 'Sent' : 'Resend'}
                              </Button>
                            )}

                            {/* Revoke button */}
                            {invite.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => setCancelTargetInvite(invite)}
                                aria-label={`Revoke invitation for ${invite.name || invite.email}`}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        )}

        {/* ------------------------------- Class assignments Tab ------------------------------- */}
        {tab === 'assignments' && (
          <div className="p-4 sm:p-6">
            <p className="mb-4 px-1 text-sm text-slate-500">
              Assign a form teacher to each class. Only teachers who have already
              joined the school can be assigned.
            </p>


            {classesLoading ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-20 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <EmptyState
                icon={<SchoolIcon className="h-6 w-6" />}
                title="No classes created yet"
                description="Create classes first, then invite teachers to lead them."
                action={
                  <Button asChild>
                    <a href="/classes">Create class</a>
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {classes.map((c) => {
                  const invite = formTeacherForClass(invitations, c.id);
                  const isAssigned = Boolean(c.formTeacher) || invite?.status === 'Accepted';
                  const isPending = !isAssigned && invite?.status === 'Pending';
                  const displayName = formatClassName(c);

                  const assignedTeacher = teachers.find(
                    (t) =>
                      (c.formTeacher && (t.userId === c.formTeacher || t.id === c.formTeacher)) ||
                      (t.classId && t.classId === c.id) ||
                      (invite?.status === 'Accepted' && (t.email === invite.email || t.userId === invite.id))
                  );
                  const teacherDisplayName =
                    assignedTeacher?.fullName ||
                    assignedTeacher?.name ||
                    c.teacher ||
                    invite?.name ||
                    invite?.email ||
                    'Assigned';

                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <SchoolIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">
                            {displayName}
                          </p>
                          {c.department && c.department !== 'Nill' && (
                            <Badge
                              tone={
                                DEPARTMENT_TONES[
                                  c.department as keyof typeof DEPARTMENT_TONES
                                ] ?? 'indigo'
                              }
                            >
                              {c.department}
                            </Badge>
                          )}
                        </div>
                        {isAssigned ? (
                          <p className="truncate text-sm text-slate-500">
                            Form Teacher:{' '}
                            <span className="font-medium text-slate-700">
                              {teacherDisplayName}
                            </span>
                          </p>
                        ) : isPending ? (
                          <p className="truncate text-sm text-slate-500">
                            Pending invite:{' '}
                            <span className="font-medium text-slate-700">
                              {invite?.name || invite?.email}
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400">
                            No form teacher assigned
                          </p>
                        )}
                      </div>

                      {isAssigned ? (
                        <Badge tone="green" dot>
                          Active
                        </Badge>
                      ) : isPending ? (
                        <Badge tone="gold" dot>
                          Pending
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignClassTarget(c)}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Teacher Detail Profile Modal */}
      <TeacherDetailModal
        teacher={detailTeacher}
        invitations={invitations}
        onClose={() => setDetailTeacher(null)}
        onToggleStatus={handleToggleStatus}
        onAssignFormTeacher={(t) => {
          setDetailTeacher(null);
          setAssignFormTeacherTarget(t);
        }}
        onAssignSubject={(t) => {
          setDetailTeacher(null);
          setAssignSubjectTarget(t);
        }}
      />

      {/* Assign Form Teacher Modal (Teacher mode) */}
      <AssignFormTeacherModal
        open={!!assignFormTeacherTarget}
        onClose={() => setAssignFormTeacherTarget(null)}
        teacher={assignFormTeacherTarget}
      />

      {/* Assign Form Teacher Modal (Class mode) */}
      <AssignFormTeacherModal
        open={!!assignClassTarget}
        onClose={() => setAssignClassTarget(null)}
        targetClass={assignClassTarget}
        onInviteTeacher={() => {
          setAssignClassTarget(null);
          openWizard();
        }}
      />

      {/* Cancel Invitation Confirmation Modal */}
      <Modal
        open={!!cancelTargetInvite}
        onClose={() => setCancelTargetInvite(null)}
        title="Cancel invitation?"
        description="This will immediately invalidate the invitation link. The recipient will not be able to use this link to join the school."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCancelTargetInvite(null)}
            >
              Keep invitation
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (cancelTargetInvite) {
                  revokeInvitation(cancelTargetInvite.id);
                  setCancelTargetInvite(null);
                }
              }}
            >
              Cancel invitation
            </Button>
          </>
        }
      >
        {cancelTargetInvite && (
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel the invitation sent to{' '}
            <span className="font-semibold text-slate-900">
              {cancelTargetInvite.name || cancelTargetInvite.email}
            </span>
            {cancelTargetInvite.className ? (
              <> for <span className="font-semibold text-slate-900">{cancelTargetInvite.className}</span></>
            ) : null}
            ?
          </p>
        )}
      </Modal>


      {/* Assign Subject Modal */}
      <AssignTeacherSubjectModal
        open={!!assignSubjectTarget}
        onClose={() => setAssignSubjectTarget(null)}
        teacher={assignSubjectTarget}
      />

      {/* Invite Teacher Modal */}
      <InviteTeacherModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        invitations={invitations}
        onInvitationCreated={(newInvite) => {
          addInvitation(newInvite);
        }}
      />
    </div>
  );
}

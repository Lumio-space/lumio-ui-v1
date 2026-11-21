'use client';

import React, { useState, useMemo } from 'react';
import {
  MailIcon,
  PhoneIcon,
  UsersIcon,
  GraduationCapIcon,
  CalendarIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useClasses } from '@/features/classes/hooks';
import { MessageParentModal } from './MessageParentModal';
import { composeClassName, GRADE_LEVEL_LABELS } from '@/features/classes/constants';
import type { ParentRecord, ParentChildRecord } from '../types';
import type { ClassRecord } from '@/features/classes/types';

interface ParentDetailModalProps {
  open: boolean;
  onClose: () => void;
  parent: ParentRecord | null;
}

export function ParentDetailModal({
  open,
  onClose,
  parent,
}: ParentDetailModalProps) {
  const [messaging, setMessaging] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const { data: rawClasses = [] } = useClasses();
  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const formChild = useMemo(() => {
    if (role !== 'teacher' || !user || !parent) return null;
    return (
      parent.children.find((child: ParentChildRecord) => {
        if (user.classId && child.classId === user.classId) return true;
        const matchedClass = classes.find(
          (c) =>
            (child.classId && c.id === child.classId) ||
            (c.formTeacher && (c.formTeacher === user.id || c.formTeacher === user.name))
        );
        return Boolean(matchedClass && (matchedClass.formTeacher === user.id || matchedClass.formTeacher === user.name));
      }) ?? null
    );
  }, [role, user, parent, classes]);

  if (!parent) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Parent profile"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {formChild ? (
              <Button
                leftIcon={<MessageSquareIcon className="h-4 w-4" />}
                onClick={() => setMessaging(true)}
                className="bg-gold-400 text-indigo-950 font-bold hover:bg-gold-300"
              >
                Message Parent
              </Button>
            ) : <div />}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Parent Header */}
          <div className="flex items-center gap-4">
            <Avatar name={parent.name} src={parent.avatar} size="xl" ring />
            <div>
              <h3 className="font-display text-lg font-extrabold text-slate-900">
                {parent.name}
              </h3>
              <p className="text-sm text-slate-500">
                {parent.children.length} linked child
                {parent.children.length === 1 ? '' : 'ren'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={parent.status === 'Active' ? 'green' : 'slate'} dot>
                  {parent.status}
                </Badge>
                {formChild && (
                  <Badge tone="gold" dot>
                    Form Teacher pastoral channel active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <MailIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Email address</p>
                <p className="truncate text-sm font-semibold text-slate-700">
                  {parent.email || '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <PhoneIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Phone number</p>
                <p className="truncate text-sm font-semibold text-slate-700">
                  {parent.phone || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Linked Children Section */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <GraduationCapIcon className="h-4 w-4" />
              Linked Children
            </p>

            {parent.children.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No students are currently linked to this parent account.
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {parent.children.map((child) => (
                  <div
                    key={child.studentId || child.studentName}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={child.studentName} src={child.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {child.studentName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {child.relationship || 'Child'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {child.className || child.grade ? (
                        <Badge tone="indigo">
                          {child.className || `${child.grade}${child.section ? ` · ${child.section}` : ''}`}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Unassigned</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Form Teacher Pastoral Messaging Modal */}
      {messaging && (
        <MessageParentModal
          open={messaging}
          parentName={parent.name}
          studentName={formChild?.studentName}
          parentEmail={parent.email}
          onClose={() => setMessaging(false)}
        />
      )}
    </>
  );
}

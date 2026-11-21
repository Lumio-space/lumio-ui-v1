'use client';

import React from 'react';
import {
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
  UsersIcon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { studentStatusTone } from '../constants';
import type { StudentRecord } from '../types';

interface StudentDetailModalProps {
  open: boolean;
  onClose: () => void;
  student: StudentRecord | null;
}

export function StudentDetailModal({
  open,
  onClose,
  student,
}: StudentDetailModalProps) {
  if (!student) return null;

  const fields = [
    {
      icon: GraduationCapIcon,
      label: 'Admission no.',
      value: student.admissionNo,
    },
    {
      icon: MailIcon,
      label: 'Email',
      value: student.email || '—',
    },
    {
      icon: UsersIcon,
      label: 'Parent / Guardian',
      value: student.parent,
    },
    {
      icon: PhoneIcon,
      label: 'Parent phone',
      value: student.parentPhone,
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student profile"
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div>
        <div className="flex items-center gap-4">
          <Avatar name={student.name} src={student.avatar} size="xl" ring />
          <div>
            <h3 className="font-display text-lg font-extrabold text-slate-900">
              {student.name}
            </h3>
            <p className="text-sm text-slate-500">
              {student.grade || 'No class assigned'}
              {student.section ? ` · Section ${student.section}` : ''}
              {student.rollNo ? ` · Roll #${student.rollNo}` : ''}
            </p>
            <div className="mt-2">
              <Badge tone={studentStatusTone[student.status]} dot>
                {student.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
            >
              <f.icon className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="truncate text-sm font-semibold text-slate-700">
                  {f.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-xs font-medium text-purple-600">Attendance</p>
            <p className="font-display text-2xl font-extrabold text-purple-700">
              {student.attendance}%
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs font-medium text-indigo-600">Average score</p>
            <p className="font-display text-2xl font-extrabold text-indigo-800">
              {student.average}%
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

'use client';

/**
 * TeacherCard
 *
 * Grid view card for an individual teacher.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenIcon, StarIcon } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { FormTeacherBadge } from './FormTeacherBadge';
import { assignmentForTeacher } from '../constants';
import type { TeacherRecord, TeacherInvitation } from '../types';

interface TeacherCardProps {
  teacher: TeacherRecord;
  invitations: TeacherInvitation[];
  index: number;
  onClick: () => void;
}

export function TeacherCard({
  teacher,
  invitations,
  index,
  onClick,
}: TeacherCardProps) {
  const teacherName = teacher.fullName || teacher.name || 'Teacher';
  const assignment = assignmentForTeacher(invitations, teacher);
  const subjects = teacher.subjects || [];
  const status = teacher.status === 'active' ? 'Active' : teacher.status;
  const rating = typeof teacher.rating === 'number' ? teacher.rating : null;
  const classesCount = teacher.classes?.length ?? (teacher.classId || assignment?.classId ? 1 : 0);
  const roleOrDept = teacher.department
    ? (teacher.staffNo ? `${teacher.staffNo} · ${teacher.department}` : teacher.department)
    : (teacher.staffNo ? teacher.staffNo : 'Teaching Faculty');

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 text-left transition-all hover:border-purple-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start justify-between w-full">
        <Avatar name={teacherName} src={teacher.avatar} size="lg" />
        <Badge tone={status === 'Active' ? 'green' : 'gold'} dot>
          {status}
        </Badge>
      </div>

      <p className="mt-3 font-semibold text-slate-900">{teacherName}</p>
      <p className="text-xs text-slate-400">
        {roleOrDept}
      </p>

      {/* Form teacher assignment */}
      <div className="mt-3 w-full rounded-xl bg-slate-50 p-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Class assignment
        </p>
        <div className="mt-1">
          <FormTeacherBadge invite={assignment} />
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <Badge key={s.id || s.title} tone="purple">
              {s.title}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex w-full items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <BookOpenIcon className="h-3.5 w-3.5" />
          <span>{classesCount} {classesCount === 1 ? 'class' : 'classes'}</span>
        </span>
        {rating !== null ? (
          <span className="flex items-center gap-1 font-semibold text-gold-500">
            <StarIcon className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
            <span>{rating}</span>
          </span>
        ) : (
          <span className="text-slate-400 truncate max-w-[130px]">
            {teacher.email ?? ''}
          </span>
        )}
      </div>
    </motion.button>
  );
}

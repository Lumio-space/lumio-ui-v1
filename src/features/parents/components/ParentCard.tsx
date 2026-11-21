'use client';

import React from 'react';
import { MailIcon, PhoneIcon } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import type { ParentRecord } from '../types';

interface ParentCardProps {
  parent: ParentRecord;
  onSelect: (parent: ParentRecord) => void;
}

export function ParentCard({ parent, onSelect }: ParentCardProps) {
  const childCount = parent.children.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(parent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(parent);
        }
      }}
      className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200"
    >
      <div>
        {/* Parent Header */}
        <div className="flex items-center gap-3">
          <Avatar name={parent.name} src={parent.avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">
              {parent.name}
            </p>
            <p className="text-xs text-slate-400">
              {childCount} {childCount === 1 ? 'child' : 'children'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-2 truncate">
            <MailIcon className="h-4 w-4 shrink-0 text-slate-300" />
            <span className="truncate">{parent.email || '—'}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <PhoneIcon className="h-4 w-4 shrink-0 text-slate-300" />
            <span className="truncate">{parent.phone || '—'}</span>
          </p>
        </div>
      </div>

      {/* Linked Children */}
      <div className="mt-4 border-t border-slate-50 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Children
        </p>

        {parent.children.length === 0 ? (
          <p className="text-xs italic text-slate-400">No linked children</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => {
              const firstName = c.studentName.split(' ')[0];
              const gradeLabel =
                c.className ||
                (c.grade ? `${c.grade}${c.section ? ` · ${c.section}` : ''}` : 'Enrolled');

              return (
                <span
                  key={c.studentId || c.studentName}
                  className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-2.5 text-xs text-slate-700"
                >
                  <Avatar name={c.studentName} src={c.avatar} size="xs" />
                  <span className="font-medium text-slate-600 truncate max-w-[80px]">
                    {firstName}
                  </span>
                  <Badge tone="indigo">{gradeLabel}</Badge>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

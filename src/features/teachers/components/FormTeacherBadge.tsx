'use client';

/**
 * FormTeacherBadge
 *
 * Compact badge showing a teacher's class assignment and invite/assignment status.
 */

import { Badge } from '@/components/shared/Badge';
import { cn } from '@/lib/utils';
import { inviteStatusTone } from '../constants';
import type { TeacherInvitation } from '../types';

interface FormTeacherBadgeProps {
  invite: TeacherInvitation | null;
  className?: string;
}

export function FormTeacherBadge({ invite, className }: FormTeacherBadgeProps) {
  if (!invite) {
    return (
      <span className={cn('text-xs text-slate-400', className)}>
        No class assignment
      </span>
    );
  }

  const tone = inviteStatusTone[invite.status];

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <Badge tone="indigo">{invite.className}</Badge>
      <Badge tone={tone} dot>
        {invite.status === 'Accepted' ? 'Form Teacher' : invite.status}
      </Badge>
    </span>
  );
}

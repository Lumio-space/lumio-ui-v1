/**
 * Badge — shared business component
 *
 * Lumio-specific tones on top of the semantic badge concept.
 * Not to be confused with shadcn's /ui/badge — that one handles
 * generic variants; this one is purpose-built for Lumio statuses.
 */

import { cn } from '@/lib/utils';

type BadgeTone = 'indigo' | 'purple' | 'gold' | 'green' | 'red' | 'slate' | 'blue';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const TONES: Record<BadgeTone, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  purple: 'bg-purple-50 text-purple-700 ring-purple-100',
  gold:   'bg-gold-50 text-gold-600 ring-gold-200',
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  red:    'bg-red-50 text-red-700 ring-red-100',
  slate:  'bg-slate-100 text-slate-600 ring-slate-200',
  blue:   'bg-sky-50 text-sky-700 ring-sky-100',
};

const DOT_COLORS: Record<BadgeTone, string> = {
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  gold:   'bg-gold-400',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  slate:  'bg-slate-400',
  blue:   'bg-sky-500',
};

export function Badge({ className, tone = 'slate', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', DOT_COLORS[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

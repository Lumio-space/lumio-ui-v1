/**
 * Progress & ProgressRing — shared business components
 *
 * Migrated from components/ui/Progress.tsx.
 * Used in attendance cards, result indicators, etc.
 */

import { cn } from '@/lib/utils';

/* ─── Progress bar ──────────────────────────────────────── */

interface ProgressProps {
  value: number; // 0–100
  tone?: 'purple' | 'indigo' | 'gold' | 'green' | 'red';
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

const TONES = {
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-700',
  gold:   'bg-gold-400',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
} as const;

export function Progress({ value, tone = 'purple', size = 'md', className, label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-slate-100',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ─── Progress ring (SVG donut) ─────────────────────────── */

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: string;
  trackTone?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 88,
  stroke = 9,
  tone = '#8B5CF6',
  trackTone = '#EDE9FE',
  children,
}: RingProps) {
  const r       = (size - stroke) / 2;
  const c       = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset  = c - (clamped / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackTone} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={tone} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

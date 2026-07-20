/**
 * StatCard — shared business component
 *
 * Animated stat card used on dashboard pages.
 * Migrated from components/ui/StatCard.tsx.
 * Requires 'use client' because of framer-motion.
 */

'use client';

import type { ReactNode } from 'react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'indigo' | 'purple' | 'gold' | 'green';
  trend?: { value: string; up: boolean };
  /** Stagger delay index */
  delay?: number;
}

const ICON_TONES = {
  indigo: 'bg-indigo-50 text-indigo-700',
  purple: 'bg-purple-50 text-purple-600',
  gold:   'bg-gold-50 text-gold-500',
  green:  'bg-emerald-50 text-emerald-600',
} as const;

export function StatCard({ label, value, icon, tone = 'indigo', trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', ICON_TONES[tone])}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            )}
          >
            {trend.up
              ? <ArrowUpRightIcon className="h-3 w-3" />
              : <ArrowDownRightIcon className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </motion.div>
  );
}

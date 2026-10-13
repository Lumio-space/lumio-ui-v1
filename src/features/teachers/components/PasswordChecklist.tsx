'use client';

import { CheckIcon } from 'lucide-react';
import { passwordRules, passwordScore } from '../schemas/accept-invitation.schema';
import { cn } from '@/lib/utils';

const barTones = [
  'bg-slate-200',
  'bg-red-400',
  'bg-amber-400',
  'bg-sky-400',
  'bg-emerald-500',
];

const textTones = [
  'text-slate-400',
  'text-red-500',
  'text-amber-600',
  'text-sky-600',
  'text-emerald-600',
];

const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

export function PasswordChecklist({ password }: { password: string }) {
  const score = passwordScore(password);

  return (
    <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Password strength
        </span>
        <span className={cn('text-xs font-bold', textTones[score])}>
          {strengthLabels[score]}
        </span>
      </div>

      {/* Segmented strength meter */}
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              seg <= score ? barTones[score] : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
        {passwordRules.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                met ? 'text-emerald-700 font-medium' : 'text-slate-500'
              )}
            >
              <span
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors text-[10px]',
                  met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                )}
              >
                {met ? <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} /> : '•'}
              </span>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

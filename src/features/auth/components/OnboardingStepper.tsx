

import { CheckIcon } from 'lucide-react';
import { ONBOARDING_STEPS } from '../schemas/onboarding.schema';
import { cn } from '@/lib/utils';

interface OnboardingStepperProps {
  currentStep: number;
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <aside className="lg:w-64 lg:shrink-0">
      <h2 className="font-display text-lg font-extrabold text-slate-900">
        Set up your school
      </h2>
      <p className="mt-1 text-sm text-slate-500">Takes about 3 minutes.</p>

      {/* Mobile progress bar */}
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 lg:hidden">
        <div
          className="h-full rounded-full bg-purple-500 transition-all duration-500"
          style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Desktop vertical stepper */}
      <ol className="mt-6 hidden space-y-1 lg:block">
        {ONBOARDING_STEPS.map((s) => {
          const state =
            s.id < currentStep ? 'done'
            : s.id === currentStep ? 'active'
            : 'todo';

          return (
            <li key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                  state === 'done'   && 'bg-emerald-500 text-white',
                  state === 'active' && 'bg-purple-500 text-white',
                  state === 'todo'   && 'bg-slate-100 text-slate-400'
                )}
              >
                {state === 'done'
                  ? <CheckIcon className="h-4 w-4" strokeWidth={3} />
                  : s.id}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  state === 'todo' ? 'text-slate-400' : 'text-slate-800'
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

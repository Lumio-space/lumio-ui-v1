

'use client';
import { useFormContext } from 'react-hook-form';
import { CheckIcon, SchoolIcon, LandmarkIcon, Building2Icon } from 'lucide-react';
import { FormField, FormMessage } from '@/components/ui/form';
import type { OnboardingFormValues } from '../../schemas/onboarding.schema';
import { cn } from '@/lib/utils';

const SCHOOL_TYPES = [
  { id: 'k12'      as const, label: 'K-12 School',           desc: 'Primary through secondary school', icon: SchoolIcon    },
  { id: 'college'  as const, label: 'College / University',  desc: 'Higher education institution',     icon: LandmarkIcon  },
  { id: 'district' as const, label: 'Multi-campus District', desc: 'Several schools, one platform',    icon: Building2Icon },
];

export function SchoolTypeStep() {
  const form = useFormContext<OnboardingFormValues>();

  return (
    <FormField
      control={form.control}
      name="schoolType"
      render={({ field }) => (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Choose the option that best describes your institution.
          </p>

          {SCHOOL_TYPES.map((t) => {
            // Fix: derive isSelected from field.value (Controller-managed),
            // not from form.watch() which had a stale-subscription issue.
            const isSelected = field.value === t.id;

            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => field.onChange(t.id)}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                    isSelected ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <t.icon className="h-5 w-5" />
                </span>

                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{t.label}</span>
                  <span className="block text-sm text-slate-500">{t.desc}</span>
                </span>

                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                  )}
                >
                  {isSelected && (
                    <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </span>
              </button>
            );
          })}

          <FormMessage />
        </div>
      )}
    />
  );
}

/**
 * NativeSelect — shared UI primitive
 *
 * A styled wrapper around the native <select> element.
 * Used in onboarding academic settings where a native select is
 * appropriate (good mobile UX, no portal/overlay complexity).
 *
 * For future searchable / async selects, use the Radix Select
 * which will be installed as part of Phase 4 data tables.
 */

import { SelectHTMLAttributes } from "react";
import { cn } from '@/lib/utils';

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900',
        'transition-colors focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'1.5\' d=\'M4 6l4 4 4-4\'/%3E%3C/svg%3E")] bg-position-[right_0.85rem_center] bg-size-[1rem] bg-no-repeat',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

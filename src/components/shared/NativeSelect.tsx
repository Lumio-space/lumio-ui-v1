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
        // Match the shadcn Input sizing / border / ring exactly
        'h-9 w-full appearance-none rounded-xl border border-input bg-background px-3 py-1.5 text-sm text-foreground',
        'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'1.5\' d=\'M4 6l4 4 4-4\'/%3E%3C/svg%3E")] bg-position-[right_0.5rem_center] bg-size-[1rem] bg-no-repeat pr-8',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

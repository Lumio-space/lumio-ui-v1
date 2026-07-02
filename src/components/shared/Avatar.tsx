/**
 * Avatar — shared business component
 *
 * Migrated from components/ui/Avatar.tsx.
 * Kept separate from shadcn's avatar primitive so we can add
 * Lumio-specific features (deterministic palette, initials logic).
 *
 * React 19: ref is now a regular prop — no forwardRef needed.
 */

import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
} as const;

/** Deterministic colour from name's first char */
const PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-gold-100 text-gold-600',
  'bg-rose-100 text-rose-700',
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md', className, ring }: AvatarProps) {
  const tone = PALETTE[name.charCodeAt(0) % PALETTE.length];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        SIZES[size],
        !src && tone,
        ring && 'ring-2 ring-white',
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

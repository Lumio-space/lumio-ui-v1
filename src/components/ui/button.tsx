/**
 * shadcn/ui Button — enhanced for Lumio
 *
 * Adds:
 *   - loading prop (shows spinner, disables button)
 *   - leftIcon / rightIcon slots (preserved from original Lumio Button)
 *   - xl size to match original "lg" button sizing on forms
 *
 * Original shadcn CVA variants and sizes kept as-is so any
 * existing code using variant="outline" etc. continues to work.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/85 shadow-soft',
        outline:     'border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:       'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        xs:      'h-6 px-2 text-xs rounded-lg',
        sm:      'h-8 px-3',
        lg:      'h-10 px-5',
        xl:      'h-12 px-6 text-base',
        icon:    'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?:  boolean;
  loading?:  boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading
        ? <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        : leftIcon}
      {children}
      {!loading && rightIcon}
    </Comp>
  );
}

export { Button, buttonVariants };

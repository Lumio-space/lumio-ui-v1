'use client';

/**
 * ClassModal
 *
 * A styled dialog wrapper using radix-ui's Dialog primitive
 * (already installed as part of the radix-ui v1 package).
 *
 * Kept inside the classes feature since there is no shared dialog
 * component in the project yet.
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Dialog }         from 'radix-ui';
import { XIcon }          from 'lucide-react';
import { cn }             from '@/lib/utils';

interface ClassModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  title:        string;
  description?: string;
  children:     ReactNode;
  size?:        'sm' | 'md' | 'lg' | 'xl';
}

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function ClassModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: ClassModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Full-screen overlay with polished backdrop */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40',
            'bg-slate-900/50 backdrop-blur-md',
            'transition-opacity duration-300 ease-out',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        />

        {/* Centered modal with pop-in animation */}
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0',
            'transition-opacity duration-300 ease-out',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          //aria-hidden="true"
        >
          <Dialog.Content
            className={cn(
              'relative w-full',
              MODAL_SIZES[size],
              'rounded-2xl bg-white',
              'shadow-elevated ring-1 ring-slate-200',
              'max-h-[92vh] flex flex-col',
              'transition-all duration-300 ease-out',
              open
                ? 'scale-100 -translate-y-0'
                : 'scale-95 -translate-y-2',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <Dialog.Title className="font-display text-lg font-bold text-slate-900">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-slate-500">
                    {description}
                  </Dialog.Description>
                )}
              </div>

              <Dialog.Close
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {children}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

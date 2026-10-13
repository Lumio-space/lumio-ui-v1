'use client';

/**
 * Shared Modal component
 *
 * Built on Radix UI's Dialog primitive with backdrop blur,
 * polished animations, customizable sizes, title, description, and footer.
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Dialog } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function Modal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40',
            'bg-slate-900/50 backdrop-blur-md',
            'transition-opacity duration-300 ease-out',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        />

        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6',
            'transition-opacity duration-300 ease-out',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <Dialog.Content
            className={cn(
              'relative w-full',
              MODAL_SIZES[size],
              'rounded-2xl bg-white',
              'shadow-elevated ring-1 ring-slate-200',
              'max-h-[90vh] flex flex-col',
              'transition-all duration-300 ease-out',
              open ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-2'
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  {title && (
                    <Dialog.Title className="font-display text-lg font-bold text-slate-900">
                      {title}
                    </Dialog.Title>
                  )}
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
            )}

            <div className="overflow-y-auto p-5 sm:p-6 flex-1">
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4 sm:px-6">
                {footer}
              </div>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

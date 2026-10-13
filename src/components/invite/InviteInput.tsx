'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InviteInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

let idCounter = 0;

export const InviteInput = forwardRef<HTMLInputElement, InviteInputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      className,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `invite-input-${++idCounter}`;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-purple-400 focus:ring-purple-100',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);
InviteInput.displayName = 'InviteInput';

export interface InviteSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const InviteSelect = forwardRef<HTMLSelectElement, InviteSelectProps>(
  (
    { label, error, className, containerClassName, id, children, ...props },
    ref
  ) => {
    const selectId = id || `invite-select-${++idCounter}`;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white bg-no-repeat px-3.5 pr-10 text-sm text-slate-900',
            'transition-colors focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100',
            className
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.85rem center',
          }}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
InviteSelect.displayName = 'InviteSelect';

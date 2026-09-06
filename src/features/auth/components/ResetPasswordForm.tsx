'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/reset-password.schema';

import { useResetPassword } from '@/features/auth/hooks/useAuth';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [friendlyError, setFriendlyError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutate: resetPassword, isPending } = useResetPassword({
    onSuccess: () => {
      setSuccess(true);
      form.reset();
    },

    onError: () => {
      setFriendlyError(
        "We couldn't reset your password. The link may be invalid or expired. Please request a new reset link."
      );
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    setFriendlyError('');

    if (!token) {
      setFriendlyError(
        'This password reset link is invalid or incomplete. Please request a new reset link.'
      );
      return;
    }

    resetPassword({
      token,
      ...values,
    });
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-sm">

        {/* Logo — mobile only */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <h2 className="font-display text-2xl font-extrabold text-slate-900">
          Reset Password
        </h2>

        <p className="mt-1.5 text-sm text-slate-500">
          Enter your new password below to reset your password.
        </p>

        {success ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2Icon
                className="mt-0.5 h-5 w-5 text-green-600"
                aria-hidden="true"
              />

              <div>
                <h3 className="font-semibold text-green-900">
                  Password reset successful
                </h3>

                <p className="mt-1 text-sm text-green-700">
                  Your password has been changed successfully. You can now sign
                  in with your new password.
                </p>

                <Link
                  href="/login"
                  className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {friendlyError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {friendlyError}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
                noValidate
              >
                {/* New password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>

                      <div className="relative">
                        <LockIcon
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />

                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="h-11 rounded-xl pl-9 pr-10"
                          />
                        </FormControl>

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
                          aria-label={
                            showPassword
                              ? 'Hide new password'
                              : 'Show new password'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? (
                            <EyeOffIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <EyeIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>

                      <div className="relative">
                        <LockIcon
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />

                        <FormControl>
                          <Input
                            {...field}
                            type={
                              showConfirmPassword ? 'text' : 'password'
                            }
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="h-11 rounded-xl pl-9 pr-10"
                          />
                        </FormControl>

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          aria-label={
                            showConfirmPassword
                              ? 'Hide confirm password'
                              : 'Show confirm password'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <EyeIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="xl"
                  loading={isPending}
                  disabled={isPending}
                  rightIcon={
                    <ArrowRightIcon className="h-4 w-4" />
                  }
                  className="w-full"
                >
                  Reset Password
                </Button>
              </form>
            </Form>
          </>
        )}

        {!success && (
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon, ArrowRightIcon } from 'lucide-react';

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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgot-password.schema';

import { useForgotPassword } from '@/features/auth/hooks/useAuth';

export function ForgotPasswordForm() {
  const {
    mutate: forgotPassword,
    isPending,
    error,
  } = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotPassword(values);
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-sm">

        {/* Logo — mobile only */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <h2 className="font-display text-2xl font-extrabold text-slate-900">
          Forgot Password
        </h2>

        <p className="mt-1.5 text-sm text-slate-500">
          Enter your email address and we'll send you a password reset link.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error instanceof Error
              ? error.message
              : 'Something went wrong.'}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 space-y-4"
            noValidate
          >

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>

                  <div className="relative">
                    <MailIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />

                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@school.edu"
                        autoComplete="email"
                        className="h-11 rounded-xl pl-9"
                      />
                    </FormControl>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="xl"
              loading={isPending}
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              className="w-full"
            >
              Send Reset Link
            </Button>

          </form>
        </Form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            ← Back to Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MailIcon,
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgot-password.schema';

import { useForgotPassword } from '@/features/auth/hooks/useAuth';

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [friendlyError, setFriendlyError] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });

  const { mutate: forgotPassword, isPending } = useForgotPassword({
    onSuccess: () => {
      setSuccess(true);
      form.reset();

      setTimeout(() => {
        setSuccess(false);
      }, 10000);
    },

    onError: () => {
      setFriendlyError(
        "We couldn't process your request. Please try again in a few minutes."
      );
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    setFriendlyError('');
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
          Enter your email address and we will send you a password reset link.
        </p>

        {success ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="mt-0.5 h-5 w-5 text-green-600" />

              <div>
                <h3 className="font-semibold text-green-900">
                  Check your inbox
                </h3>

                <p className="mt-1 text-sm text-green-700">
                  If an account exists for that email, we have sent password
                  reset instructions. Please check your inbox and your spam
                  folder.
                </p>
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
                  disabled={isPending || success}
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  className="w-full"
                >
                  Send Reset Link
                </Button>
              </form>
            </Form>
          </>
        )}

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
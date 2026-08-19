/**
 * LoginForm — auth feature component
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon, LockIcon, ArrowRightIcon, EyeOffIcon, EyeIcon } from 'lucide-react';

import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema';
import { useLogin } from '@/features/auth/hooks/useAuth';

import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo }     from '@/components/Logo';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();
  const [ showPassword, setShowPassword ] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver:      zodResolver(loginSchema),
    mode:          'onBlur',   // show errors when leaving a field, not only on submit
    defaultValues: {
      email:      '',
      password:   '',
      rememberMe: false,
    },
  });

  function onSubmit(values: LoginFormValues) {
    login(values);
  }

  return (
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-2xl font-extrabold text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your Lumio workspace to continue.
          </p>

          {/* API error banner */}
          {error && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error instanceof Error ? error.message : 'Something went wrong.'}
              </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>

              {/* Email — icon is outside FormControl so label → input */}
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

              {/* Password */}
              <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <LockIcon
                              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                              aria-hidden="true"
                          />
                          <FormControl>
                            <Input
                                {...field}
                                type={showPassword ? 'text': 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="h-11 rounded-xl pl-9"
                            />
                          </FormControl>
                          <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? (
                                <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <EyeIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                  )}
              />

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                          <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                          />
                          Remember me
                        </label>
                    )}
                />
                <Link href="/forgot-password" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <Button
                  type="submit"
                  size="xl"
                  loading={isPending}
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  className="w-full"
              >
                Sign in
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* SSO */}
          <Button
              variant="outline"
              size="xl"
              className="w-full"
              onClick={() => { window.location.href = '/dashboard'; }}
          >
            Continue with SSO
          </Button>

          {/* Onboarding CTA */}
          <p className="mt-8 text-center text-sm text-slate-500">
            New school?{' '}
            <Link href="/onboarding" className="font-semibold text-indigo-700 hover:text-indigo-900">
              Set up your workspace
            </Link>
          </p>
        </div>
      </div>
  );
}
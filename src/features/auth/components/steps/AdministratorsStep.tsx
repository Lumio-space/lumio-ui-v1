

'use client';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import type { OnboardingFormValues } from '@/features/auth/schemas/onboarding.schema';

export function AdministratorsStep() {
  const form = useFormContext<OnboardingFormValues>();
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        This account will be the <strong className="font-semibold text-slate-700">Primary School Administrator</strong>.
        Additional administrators can be added from within the dashboard after setup.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="adminFullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Adaeze Okonkwo" className="h-11 rounded-xl" autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField control={form.control} name="adminEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="admin@yourschool.edu.ng" className="h-11 rounded-xl" autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField control={form.control} name="adminPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="e.g. 08012345678" className="h-11 rounded-xl" autoComplete="tel" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Password */}
        <FormField control={form.control} name="adminPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="h-11 rounded-xl pr-10"
                    autoComplete="new-password"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword
                    ? <EyeOffIcon className="h-4 w-4" />
                    : <EyeIcon    className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm password */}
        <FormField control={form.control} name="adminConfirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password <span className="text-destructive">*</span></FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="h-11 rounded-xl pr-10"
                    autoComplete="new-password"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword
                    ? <EyeOffIcon className="h-4 w-4" />
                    : <EyeIcon    className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Password must be at least 8 characters. You can change it at any time in Settings.
      </p>
    </div>
  );
}

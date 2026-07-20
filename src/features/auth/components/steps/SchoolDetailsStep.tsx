

'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/shared/NativeSelect';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { NIGERIA_STATES } from '@/config/nigeria-states';
import type { OnboardingFormValues } from '../../schemas/onboarding.schema';

export function SchoolDetailsStep() {
  const form = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-4">
      <FormField control={form.control} name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>School name <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Greenfield Secondary School" className="h-11 rounded-xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact email <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="admin@yourschool.edu.ng" className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="e.g. 08012345678" className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField control={form.control} name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street address <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. 15 Victoria Island Road" className="h-11 rounded-xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / LGA <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Ikeja" className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <NativeSelect {...field} className="h-11">
                  <option value="">Select a state…</option>
                  {NIGERIA_STATES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

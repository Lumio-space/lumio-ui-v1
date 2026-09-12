'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver }      from '@hookform/resolvers/zod';
import { AlertCircleIcon }  from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/shared/NativeSelect';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import { CLASS_SECTIONS, GRADE_LEVELS, SCHOOL_LEVELS } from '../constants';
import { useCreateClass } from '../hooks';
import { createClassSchema, type CreateClassFormValues, type CreateClassFormInput } from '../schemas';
import type { SchoolLevel } from '../types';

interface CreateClassFormProps {
  /** Called after the class is successfully created. */
  onSuccess: () => void;
  /** Called when the user clicks cancel. */
  onCancel?: () => void;
}

export function CreateClassForm({ onSuccess, onCancel }: CreateClassFormProps) {
  const { mutate, isPending, error, reset: resetMutation } = useCreateClass();

  const form = useForm<CreateClassFormInput, unknown, CreateClassFormValues>({
    resolver:      zodResolver(createClassSchema),
    mode:          'onBlur',
    defaultValues: {
      schoolLevel:  '' as SchoolLevel, // intentionally empty so Zod fires on submit
      gradeLevel:   '',
      gradeSection: '',
      room:         '',
      capacity:     '',
    },
  });

  const watchedSchoolLevel = useWatch({
    control: form.control,
    name: 'schoolLevel',
  }) as SchoolLevel | undefined;
  const gradeLevelOptions  = watchedSchoolLevel ? GRADE_LEVELS[watchedSchoolLevel] : [];

  /**
   * When the school level changes, clear gradeLevel only if the current
   * value is no longer in the valid option set for the new level.
   * This pattern avoids spuriously clearing a valid prefilled value.
   */
  useEffect(() => {
    if (!watchedSchoolLevel) return;
    const current = form.getValues('gradeLevel');
    const valid   = GRADE_LEVELS[watchedSchoolLevel];
    if (current && !valid.some((opt) => opt.value === current)) {
      form.setValue('gradeLevel', '', { shouldValidate: false });
    }
  }, [watchedSchoolLevel, form]);

  function onSubmit(values: CreateClassFormValues) {
    resetMutation();
    mutate(values, { onSuccess });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex h-full flex-col">
        {/* Form fields grid */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {/* API error banner */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error instanceof Error ? error.message : 'Something went wrong.'}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* School Level */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="schoolLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      School Level <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NativeSelect
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={isPending}
                      >
                        <option value="">Select school level</option>
                        {SCHOOL_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Class Level */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Class Level <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NativeSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={!watchedSchoolLevel || isPending}
                      >
                        <option value="">
                          {watchedSchoolLevel
                            ? 'Select class level'
                            : 'Select a school level first'}
                        </option>
                        {gradeLevelOptions.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Class Arm */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="gradeSection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Class Arm <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NativeSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={isPending}
                      >
                        <option value="">Select class arm (A, B, C…)</option>
                        {CLASS_SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            Arm {section}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Room */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Room <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 101"
                        min={1}
                        className="h-9 rounded-xl"
                        value={(field.value as string | number) ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Capacity <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 35"
                        min={1}
                        className="h-9 rounded-xl"
                        value={(field.value as string | number) ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 sm:p-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={isPending}>
            Create class
          </Button>
        </div>
      </form>
    </Form>
  );
}

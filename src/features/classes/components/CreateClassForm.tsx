'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver }      from '@hookform/resolvers/zod';
import { AlertCircleIcon, InfoIcon, AlertTriangleIcon }  from 'lucide-react';
import { motion }           from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/shared/NativeSelect';
import { Badge } from '@/components/shared/Badge';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import {
  CLASS_SECTIONS,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  SCHOOL_LEVELS,
  DEPARTMENTS,
  sectionHasDepartment,
  composeClassName,
} from '../constants';
import { useCreateClass, useClasses } from '../hooks';
import { normalizeGradeLevelForBackend } from '../api/classes.api';
import { createClassSchema, type CreateClassFormValues, type CreateClassFormInput } from '../schemas';
import type { SchoolLevel, Department, CreateClassPayload } from '../types';

interface CreateClassFormProps {
  /** Called after the class is successfully created. */
  onSuccess: () => void;
  /** Called when the user clicks cancel. */
  onCancel?: () => void;
}

interface DuplicatePopUpInfo {
  title: string;
  message: string;
  detail?: string;
  actionLabel?: string;
}

export function CreateClassForm({ onSuccess, onCancel }: CreateClassFormProps) {
  const { mutate, isPending, error, reset: resetMutation } = useCreateClass();
  const { data: existingClasses = [] } = useClasses();
  const [duplicatePopUp, setDuplicatePopUp] = useState<DuplicatePopUpInfo | null>(null);

  const form = useForm<CreateClassFormInput, unknown, CreateClassFormValues>({
    resolver:      zodResolver(createClassSchema),
    mode:          'onBlur',
    defaultValues: {
      schoolLevel:  '' as SchoolLevel, // intentionally empty so Zod fires on submit
      gradeLevel:   '',
      gradeSection: '',
      department:   '',
      room:         '',
      capacity:     '',
    },
  });

  const watchedSchoolLevel = useWatch({
    control: form.control,
    name: 'schoolLevel',
  }) as SchoolLevel | undefined;
  const watchedGradeLevel = useWatch({
    control: form.control,
    name: 'gradeLevel',
  }) as string | undefined;
  const watchedGradeSection = useWatch({
    control: form.control,
    name: 'gradeSection',
  }) as string | undefined;
  const watchedDepartment = useWatch({
    control: form.control,
    name: 'department',
  }) as Department | '' | undefined;
  const watchedRoom = useWatch({
    control: form.control,
    name: 'room',
  }) as string | number | undefined;

  const gradeLevelOptions  = watchedSchoolLevel ? GRADE_LEVELS[watchedSchoolLevel] : [];

  /**
   * When the school level changes, clear gradeLevel only if the current
   * value is no longer in the valid option set for the new level.
   * Also clear department if switching away from Senior Secondary.
   */
  useEffect(() => {
    if (!watchedSchoolLevel) return;
    const current = form.getValues('gradeLevel');
    const valid   = GRADE_LEVELS[watchedSchoolLevel];
    if (current && !valid.some((opt) => opt.value === current)) {
      form.setValue('gradeLevel', '', { shouldValidate: false });
    }
    if (!sectionHasDepartment(watchedSchoolLevel)) {
      form.setValue('department', '', { shouldValidate: false });
    } else {
      const currentDept = form.getValues('department');
      if (!currentDept) {
        form.setValue('department', 'Science', { shouldValidate: false });
      }
    }
  }, [watchedSchoolLevel, form]);

  const displayGrade = watchedGradeLevel
    ? (GRADE_LEVEL_LABELS[watchedGradeLevel] ?? watchedGradeLevel)
    : '';
  const previewName = composeClassName(
    displayGrade,
    sectionHasDepartment(watchedSchoolLevel) ? (watchedDepartment || '') : '',
    watchedGradeSection || ''
  );

  // Live duplicate ARM detection for the selected class level
  const duplicateArmClass = existingClasses.find((c) => {
    const cGrade = normalizeGradeLevelForBackend(c.grade);
    const targetGrade = normalizeGradeLevelForBackend(watchedGradeLevel || '');
    const cArm = (c.section || '').trim().toUpperCase();
    const targetArm = (watchedGradeSection || '').trim().toUpperCase();
    return (
      Boolean(targetGrade) &&
      Boolean(targetArm) &&
      cGrade.toLowerCase() === targetGrade.toLowerCase() &&
      cArm === targetArm
    );
  });

  // Live duplicate room/location detection
  const duplicateRoomClass = existingClasses.find((c) => {
    const targetRoom = Number(watchedRoom);
    return targetRoom > 0 && Number(c.room) === targetRoom;
  });

  const apiErrorMessage = error instanceof Error ? error.message : '';
  const isDuplicateApiError =
    Boolean(apiErrorMessage) &&
    /duplicate|already exists|already in use|unique|violates unique constraint|school_grade_section_idx|room/i.test(
      apiErrorMessage
    );

  useEffect(() => {
    if (error && isDuplicateApiError) {
      const msg = error instanceof Error ? error.message : 'Class already exists.';
      const isRoom = /room|location/i.test(msg);
      const isArm = /arm|section|grade|school_grade_section_idx/i.test(msg);
      setDuplicatePopUp({
        title: isRoom
          ? 'Room / Location Already In Use'
          : isArm
          ? 'Class Arm Already Exists'
          : 'Class Already Exists',
        message: msg,
        detail: isRoom
          ? 'The selected room or location is already assigned to another class.'
          : 'The selected class level and arm combination already exists in this school.',
        actionLabel: 'Change Details',
      });
    }
  }, [error, isDuplicateApiError]);


  function onSubmit(values: CreateClassFormValues) {
    resetMutation();
    setDuplicatePopUp(null);

    // Pre-check duplicate ARM
    const targetGrade = normalizeGradeLevelForBackend(values.gradeLevel);
    const targetArm = values.gradeSection.trim().toUpperCase();
    const existingArmConflict = existingClasses.find((c) => {
      const cGrade = normalizeGradeLevelForBackend(c.grade);
      const cArm = (c.section || '').trim().toUpperCase();
      return (
        Boolean(targetGrade) &&
        Boolean(targetArm) &&
        cGrade.toLowerCase() === targetGrade.toLowerCase() &&
        cArm === targetArm
      );
    });

    if (existingArmConflict) {
      const conflictGrade = GRADE_LEVEL_LABELS[existingArmConflict.grade] ?? existingArmConflict.grade;
      const conflictName = composeClassName(conflictGrade, existingArmConflict.department, existingArmConflict.section);
      setDuplicatePopUp({
        title: 'Class Arm Already Exists',
        message: `A class with level "${displayGrade}" and Arm "${values.gradeSection}" already exists in this school (${conflictName}).`,
        detail: 'Each class arm within a grade level must be unique. Please select another class arm.',
        actionLabel: 'Select Another Arm',
      });
      return;
    }

    // Pre-check duplicate Room / Location
    const targetRoom = Number(values.room);
    const existingRoomConflict = existingClasses.find(
      (c) => targetRoom > 0 && Number(c.room) === targetRoom
    );

    if (existingRoomConflict) {
      const conflictGrade = GRADE_LEVEL_LABELS[existingRoomConflict.grade] ?? existingRoomConflict.grade;
      const conflictName = composeClassName(conflictGrade, existingRoomConflict.department, existingRoomConflict.section);
      setDuplicatePopUp({
        title: 'Room / Location Already In Use',
        message: `Room "${values.room}" is already associated with an existing class (${conflictName}).`,
        detail: 'Classrooms and physical rooms cannot be assigned to multiple classes simultaneously. Please enter a different room number.',
        actionLabel: 'Change Room Number',
      });
      return;
    }

    const payload: CreateClassPayload = {
      schoolLevel: values.schoolLevel,
      gradeLevel: values.gradeLevel,
      gradeSection: values.gradeSection,
      room: values.room,
      capacity: values.capacity,
    };

    if (values.schoolLevel === 'senior_secondary' && values.department) {
      payload.department = values.department as Department;
    }

    mutate(payload, {
      onSuccess,
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Failed to create class.';
        if (
          /duplicate|already exists|already in use|unique|violates unique constraint|school_grade_section_idx|room/i.test(
            msg
          )
        ) {
          const isRoom = /room|location/i.test(msg);
          const isArm = /arm|section|grade|school_grade_section_idx/i.test(msg);
          setDuplicatePopUp({
            title: isRoom
              ? 'Room / Location Already In Use'
              : isArm
              ? 'Class Arm Already Exists'
              : 'Class Already Exists',
            message: msg,
            detail: isRoom
              ? 'The selected room or location is already assigned to another class.'
              : 'The selected class level and arm combination already exists in this school.',
            actionLabel: 'Change Details',
          });
        }
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative flex h-full flex-col">
        {/* Centered duplicate pop-up modal inside class container */}
        {duplicatePopUp && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-popup-title"
            className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangleIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 id="duplicate-popup-title" className="font-display text-base font-bold text-slate-900">
                  {duplicatePopUp.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {duplicatePopUp.message}
                </p>
                {duplicatePopUp.detail && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    {duplicatePopUp.detail}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setDuplicatePopUp(null)}
                >
                  {duplicatePopUp.actionLabel || 'Understood'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form fields body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {/* Non-duplicate API error banner (duplicate errors are displayed via centered pop-up above) */}
          {error && !isDuplicateApiError && !duplicatePopUp && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error instanceof Error ? error.message : 'Something went wrong.'}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* School level — full width */}
            <FormField
              control={form.control}

              name="schoolLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                    School level <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                      aria-label="School level"
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

            {/* Class level and Class arm — 2 columns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                      Class level <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NativeSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={!watchedSchoolLevel || isPending}
                        aria-label="Class level"
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

              <FormField
                control={form.control}
                name="gradeSection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                      Class arm <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NativeSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={isPending}
                        aria-label="Class arm"
                      >
                        <option value="">Select class arm</option>
                        {CLASS_SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                    {duplicateArmClass && (
                      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Arm &quot;{watchedGradeSection}&quot; is already in use for {displayGrade || 'this level'}.</span>
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Senior Secondary only — department / track selection */}
            {sectionHasDepartment(watchedSchoolLevel) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                          Department / Track
                        </FormLabel>
                        <FormControl>
                          <NativeSelect
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled={isPending}
                            aria-label="Department / Track"
                          >
                            <option value="">Not configured yet</option>
                            {DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormControl>
                        <p className="mt-1.5 text-xs text-indigo-600">
                          Senior Secondary classes belong to a track. You choose it — it
                          is never derived from the class level.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>
            )}

            {/* Capacity and Room / Location — 2 columns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                      Capacity <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        min={1}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                        value={(field.value as string | number) ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={isPending}
                        aria-label="Capacity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-sm font-medium text-slate-700">
                      Room / Location <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="101"
                        min={1}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                        value={(field.value as string | number) ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={isPending}
                        aria-label="Room / Location"
                      />
                    </FormControl>
                    <FormMessage />
                    {duplicateRoomClass && (
                      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Room {watchedRoom} is already assigned to an existing class.</span>
                      </p>
                    )}
                  </FormItem>
                )}
              />

            </div>

            {/* Live preview of the composed class name */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
              <span className="text-sm text-slate-500">This class will be</span>
              <span className="font-display text-base font-extrabold text-slate-900">
                {previewName || '—'}
              </span>
              {sectionHasDepartment(watchedSchoolLevel) && !watchedDepartment && (
                <Badge tone="gold" dot>
                  Department not configured
                </Badge>
              )}
            </div>

            {/* Informational callout matching lumio-react */}
            <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-4">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
              <p className="text-sm text-indigo-700">
                Form Teachers are assigned from the{' '}
                <Link
                  href="/teachers"
                  className="font-semibold underline underline-offset-2 hover:text-indigo-950"
                >
                  Teachers
                </Link>{' '}
                section, and subjects are mapped from{' '}
                <Link
                  href="/subjects"
                  className="font-semibold underline underline-offset-2 hover:text-indigo-950"
                >
                  Subjects
                </Link>
                , once this class exists.
              </p>
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


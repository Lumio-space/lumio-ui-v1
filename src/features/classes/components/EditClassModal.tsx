'use client';

/**
 * EditClassModal
 *
 * Allows an administrator to edit an existing class:
 * grade level, section (arm), school level, department (for Senior Secondary),
 * capacity, and room.
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon, InfoIcon } from 'lucide-react';
import { motion } from 'framer-motion';

import { Modal } from '@/components/shared/Modal';
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
import { useUpdateClass, useClasses } from '@/features/classes/hooks';
import { createClassSchema, type CreateClassFormValues, type CreateClassFormInput } from '../schemas';
import type { ClassRecord, SchoolLevel, Department } from '../types';

interface EditClassModalProps {
  open: boolean;
  classRecord: ClassRecord | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditClassModal({
  open,
  classRecord,
  onClose,
  onSuccess,
}: EditClassModalProps) {
  const { mutate, isPending, error, reset: resetMutation } = useUpdateClass();
  const { data: existingClasses = [] } = useClasses();
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const form = useForm<CreateClassFormInput, unknown, CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    mode: 'onBlur',
    defaultValues: {
      schoolLevel: '' as SchoolLevel,
      gradeLevel: '',
      gradeSection: '',
      department: '',
      room: '',
      capacity: '',
    },
  });

  useEffect(() => {
    if (classRecord && open) {
      const dept =
        classRecord.department && classRecord.department !== 'Nill'
          ? (classRecord.department as Department)
          : '';
      form.reset({
        schoolLevel: (classRecord.level ?? '') as SchoolLevel,
        gradeLevel: classRecord.grade ?? '',
        gradeSection: classRecord.section ?? '',
        department: dept,
        room: classRecord.room ? String(classRecord.room) : '',
        capacity: classRecord.capacity ? String(classRecord.capacity) : '',
      });
      setDuplicateWarning(null);
      resetMutation?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classRecord?.id, open]);

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

  const gradeLevelOptions = watchedSchoolLevel ? GRADE_LEVELS[watchedSchoolLevel] : [];

  useEffect(() => {
    if (!watchedSchoolLevel) return;
    const current = form.getValues('gradeLevel');
    const valid = GRADE_LEVELS[watchedSchoolLevel] || [];
    if (current && !valid.some((g) => g.value === current)) {
      form.setValue('gradeLevel', '', { shouldValidate: true });
    }
    if (!sectionHasDepartment(watchedSchoolLevel)) {
      form.setValue('department', '', { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSchoolLevel]);

  useEffect(() => {
    if (!classRecord) return;
    const allClasses = Array.isArray(existingClasses)
      ? existingClasses
      : (existingClasses as any)?.data || (existingClasses as any)?.classes || [];

    const otherClasses = allClasses.filter((c: ClassRecord) => c.id !== classRecord.id);

    if (watchedGradeLevel && watchedGradeSection) {
      const isDuplicateArm = otherClasses.some(
        (c: ClassRecord) =>
          c.grade === watchedGradeLevel &&
          c.section.toLowerCase() === watchedGradeSection.toLowerCase()
      );
      if (isDuplicateArm) {
        setDuplicateWarning(`Another class already uses grade ${watchedGradeLevel} section ${watchedGradeSection}.`);
        return;
      }
    }

    if (watchedRoom) {
      const roomNum = Number(watchedRoom);
      const isDuplicateRoom = otherClasses.some((c: ClassRecord) => Number(c.room) === roomNum);
      if (isDuplicateRoom) {
        setDuplicateWarning(`Room ${roomNum} is already assigned to another class.`);
        return;
      }
    }

    setDuplicateWarning(null);
  }, [watchedGradeLevel, watchedGradeSection, watchedRoom, existingClasses, classRecord]);

  function handleClose() {
    form.reset();
    setDuplicateWarning(null);
    resetMutation?.();
    onClose();
  }

  function onSubmit(values: CreateClassFormValues) {
    if (!classRecord) return;
    resetMutation?.();

    const isSeniorSec = values.schoolLevel === 'senior_secondary';
    const dept = isSeniorSec && values.department ? (values.department as Department) : 'Nill';

    mutate(
      {
        id: classRecord.id,
        payload: {
          schoolLevel: values.schoolLevel,
          gradeLevel: values.gradeLevel,
          gradeSection: values.gradeSection,
          department: dept,
          room: Number(values.room),
          capacity: Number(values.capacity),
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
          onClose();
        },
      }
    );
  }

  if (!classRecord) return null;

  const rawGrade = watchedGradeLevel || classRecord.grade;
  const gradeLabel = GRADE_LEVEL_LABELS[rawGrade] ?? rawGrade;
  const previewName = composeClassName(
    gradeLabel || 'Grade',
    watchedDepartment || undefined,
    watchedGradeSection || 'Arm'
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit class"
      description={`Update class configuration and room allocation for ${classRecord.grade} ${classRecord.section}.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-class-form"
            loading={isPending}
            disabled={isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="edit-class-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error instanceof Error ? error.message : 'Failed to update class.'}</span>
            </div>
          )}

          {duplicateWarning && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Reactive Class Name Preview Badge */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Class display preview:</span>
            <Badge tone="indigo">{previewName}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* School Level */}
            <FormField
              control={form.control}
              name="schoolLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    School level <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                    >
                      <option value="">Select a level</option>
                      {SCHOOL_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Class Grade Level */}
            <FormField
              control={form.control}
              name="gradeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Class grade <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending || !watchedSchoolLevel}
                    >
                      <option value="">
                        {watchedSchoolLevel ? 'Select grade' : 'Choose level first'}
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

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Class Arm (Section) */}
            <FormField
              control={form.control}
              name="gradeSection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Class arm (Section) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                    >
                      <option value="">Select an arm</option>
                      {CLASS_SECTIONS.map((sec) => (
                        <option key={sec} value={sec}>
                          Arm {sec}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room Number */}
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Room number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 101"
                      value={(field.value as string | number) ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                      className="h-10 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Department (Senior Secondary only) */}
          {sectionHasDepartment(watchedSchoolLevel) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Senior Secondary Department
                </p>
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Department <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <NativeSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          disabled={isPending}
                        >
                          <option value="">Select a department</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          )}

          {/* Capacity */}
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Student capacity <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 35"
                    value={(field.value as string | number) ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    disabled={isPending}
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Modal>
  );
}

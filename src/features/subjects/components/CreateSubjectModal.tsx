'use client';

/**
 * CreateSubjectModal
 *
 * Migrated from lumio-react SubjectsPage.tsx create subject modal.
 * CRITICAL PRODUCT REQUIREMENT:
 * The Description field has been completely removed from UI, state, schema, and payload.
 */

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpDownIcon, AlertCircleIcon } from 'lucide-react';
import { motion } from 'framer-motion';

import { Modal } from '@/components/shared/Modal';
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

import {
  SCHOOL_SECTIONS,
  SUBJECT_DEPARTMENTS,
  SUBJECT_TYPES,
  sectionHasDepartment,
} from '../constants';
import {
  createSubjectSchema,
  type CreateSubjectFormInput,
  type CreateSubjectFormValues,
} from '../schemas';
import { useCreateSubject } from '../hooks';
import type { SubjectRecord, SchoolSection, SubjectDepartment, SubjectType } from '../types';

interface CreateSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (createdSubject: SubjectRecord) => void;
}

export function CreateSubjectModal({
  open,
  onClose,
  onCreated,
}: CreateSubjectModalProps) {
  const { mutate, isPending, error, reset: resetMutation } = useCreateSubject();

  const form = useForm<CreateSubjectFormInput, unknown, CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      code: '',
      section: '' as SchoolSection,
      department: '',
      type: '',
      status: 'Active',
    },
  });

  const watchedSection = useWatch({
    control: form.control,
    name: 'section',
  }) as SchoolSection | undefined;

  function handleClose() {
    form.reset();
    resetMutation();
    onClose();
  }

  function onSubmit(values: CreateSubjectFormValues) {
    resetMutation();
    mutate(
      {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        section: values.section,
        department: sectionHasDepartment(values.section)
          ? (values.department as SubjectDepartment)
          : undefined,
        type: sectionHasDepartment(values.section)
          ? (values.type as SubjectType)
          : undefined,
        status: values.status,
      },
      {
        onSuccess: (newSubject) => {
          form.reset();
          onCreated(newSubject);
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create subject"
      description="Subjects belong to the school. You'll choose classes and teachers in the next steps."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-subject-form"
            loading={isPending}
            disabled={isPending}
          >
            Create subject
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="create-subject-form"
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
              <span>{error instanceof Error ? error.message : 'Failed to create subject.'}</span>
            </div>
          )}

          {/* Subject Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Subject name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Mathematics"
                    value={field.value}
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

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subject Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subject code <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. MTH"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                      className="h-10 rounded-xl uppercase"
                    />
                  </FormControl>
                  <p className="text-xs text-slate-400">A short unique code.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* School Section */}
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    School section <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (!sectionHasDepartment(e.target.value)) {
                          form.setValue('department', '');
                          form.setValue('type', '');
                        }
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={isPending}
                    >
                      <option value="">Select a section</option>
                      {SCHOOL_SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Senior Secondary configuration — revealed only for Senior Secondary */}
          {sectionHasDepartment(watchedSection) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Senior Secondary configuration
                </p>
                <p className="mt-0.5 text-xs text-indigo-600">
                  You decide how this school classifies the subject.
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {/* Department / Track */}
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department / Track <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <NativeSelect
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled={isPending}
                          >
                            <option value="">Select a department</option>
                            {SUBJECT_DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subject Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Subject type <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <NativeSelect
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled={isPending}
                          >
                            <option value="">Select a type</option>
                            {SUBJECT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <NativeSelect
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    disabled={isPending}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hint note matching lumio-react */}
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            <ArrowUpDownIcon className="mt-0.5 h-4 w-4 shrink-0 rotate-90 text-slate-400" />
            <p>
              Next you&rsquo;ll choose the classes that offer this subject, then assign a teacher to each class.
            </p>
          </div>
        </form>
      </Form>
    </Modal>
  );
}

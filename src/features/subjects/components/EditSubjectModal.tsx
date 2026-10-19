'use client';

/**
 * EditSubjectModal
 *
 * Allows an administrator to configure or edit an existing subject,
 * including updating its name, code, section, department, and subject type.
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon } from 'lucide-react';
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
import { useUpdateSubject } from '../hooks';
import type { SubjectRecord, SchoolSection, SubjectDepartment, SubjectType } from '../types';

interface EditSubjectModalProps {
  open: boolean;
  subject: SubjectRecord | null;
  onClose: () => void;
  onUpdated: (updatedSubject: SubjectRecord) => void;
}

export function EditSubjectModal({
  open,
  subject,
  onClose,
  onUpdated,
}: EditSubjectModalProps) {
  const { mutate, isPending, error, reset: resetMutation } = useUpdateSubject();

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

  useEffect(() => {
    if (subject && open) {
      form.reset({
        name: subject.name ?? '',
        code: subject.code ?? '',
        section: subject.section,
        department: subject.department ?? '',
        type: subject.type ?? '',
        status: subject.status,
      });
      resetMutation?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id, open]);

  const watchedSection = useWatch({
    control: form.control,
    name: 'section',
  }) as SchoolSection | undefined;

  function handleClose() {
    form.reset();
    resetMutation?.();
    onClose();
  }

  function onSubmit(values: CreateSubjectFormValues) {
    if (!subject) return;
    resetMutation?.();
    const hasDept = sectionHasDepartment(values.section);

    mutate(
      {
        id: subject.id,
        payload: {
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          section: values.section,
          department: hasDept ? (values.department as SubjectDepartment) : undefined,
          type: hasDept ? (values.type as SubjectType) : undefined,
          status: values.status,
        },
      },
      {
        onSuccess: (updatedSubject) => {
          form.reset();
          onUpdated(updatedSubject);
        },
      }
    );
  }

  if (!subject) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit subject"
      description={`Update configuration and academic track details for ${subject.name}.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-subject-form"
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
          id="edit-subject-form"
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
              <span>{error instanceof Error ? error.message : 'Failed to update subject.'}</span>
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
                  Configure department and whether the subject is compulsory or elective.
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

          {/* Subject Status */}
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
        </form>
      </Form>
    </Modal>
  );
}

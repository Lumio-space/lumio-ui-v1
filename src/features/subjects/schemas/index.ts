import { z } from 'zod';
import { SCHOOL_SECTIONS, SUBJECT_DEPARTMENTS, SUBJECT_TYPES } from '../constants';
import type { SchoolSection } from '../types';

export const createSubjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Subject name is required.'),

    code: z
      .string()
      .trim()
      .min(1, 'Subject code is required.')
      .max(10, 'Subject code must be 10 characters or fewer.'),

    section: z
      .string()
      .min(1, 'Select a school section.')
      .refine(
        (v): v is SchoolSection => (SCHOOL_SECTIONS as readonly string[]).includes(v),
        { message: 'Select a valid school section.' }
      ),

    department: z
      .string()
      .optional()
      .refine(
        (v) => !v || (SUBJECT_DEPARTMENTS as readonly string[]).includes(v),
        { message: 'Select a valid department or track.' }
      ),

    type: z
      .string()
      .optional()
      .refine(
        (v) => !v || (SUBJECT_TYPES as readonly string[]).includes(v),
        { message: 'Select a valid subject type.' }
      ),

    status: z.enum(['Active', 'Inactive']).default('Active'),
  })
  .superRefine((data, ctx) => {
    if (data.section === 'Senior Secondary') {
      if (!data.department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a department or track for Senior Secondary.',
          path: ['department'],
        });
      }
      if (!data.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select Compulsory or Elective for Senior Secondary.',
          path: ['type'],
        });
      }
    }
  });

export type CreateSubjectFormInput = z.input<typeof createSubjectSchema>;
export type CreateSubjectFormValues = z.output<typeof createSubjectSchema>;

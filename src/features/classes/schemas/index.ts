import { z } from 'zod';
import type { SchoolLevel } from '../types';

const SCHOOL_LEVEL_VALUES = [
  'nursery',
  'primary',
  'junior_secondary',
  'senior_secondary',
] as const;

export const createClassSchema = z.object({
    /**
   * z.string().min(1) ensures the empty-select case shows the friendly
   * "Please select a school level." message. z.enum() alone fires its own
   * Zod-internal error for invalid values and ignores the refine message.
   */
  schoolLevel: z
    .string()
    .min(1, 'Please select a school level.')
    .refine(
      (v): v is SchoolLevel =>
        (SCHOOL_LEVEL_VALUES as readonly string[]).includes(v),
      { message: 'Please select a valid school level.' },
    ),
  gradeLevel: z
    .string()
    .min(1, 'Please select a class level.'),

  gradeSection: z
    .string()
    .min(1, 'Please select a class arm.'),

  room: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ error: 'Please enter a room number.' })
      .int('Room number must be a whole number.')
      .positive('Room number must be greater than 0.'),
  ),

  capacity: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ error: 'Please enter class capacity.' })
      .int('Capacity must be a whole number.')
      .positive('Capacity must be greater than 0.'),
  ),
});

export type CreateClassFormInput = z.input<typeof createClassSchema>;
export type CreateClassFormValues = z.output<typeof createClassSchema>;

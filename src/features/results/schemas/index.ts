import { z } from 'zod';

const componentScoreSchema = z
  .number({ message: 'Enter a valid number.' })
  .int('Score must be a whole number.')
  .min(0, 'Minimum score is 0.')
  .max(100, 'Maximum component score is 100.');

export const resultEntryScoreSchema = z
  .object({
    testScore: componentScoreSchema,
    caScore: componentScoreSchema,
    examScore: componentScoreSchema,
  })
  .refine((data) => data.testScore + data.caScore + data.examScore < 100, {
    message: 'Total score must be less than 100 (backend rejects totals of 100 or above).',
    path: ['examScore'],
  });

export const createResultCardBatchSchema = z.object({
  quantity: z
    .number({ message: 'Quantity is required.' })
    .int('Quantity must be a whole number.')
    .min(1, 'Minimum quantity is 1.')
    .max(500, 'Maximum quantity per batch is 500.'),
  academicYear: z
    .string()
    .trim()
    .min(1, 'Academic year is required.'),
  term: z.enum(['first_term', 'second_term', 'third_term']),
});

export const redeemResultCardSchema = z.object({
  serialNumber: z
    .string()
    .trim()
    .min(1, 'Serial number is required.'),
  pin: z
    .string()
    .trim()
    .min(1, 'PIN is required.'),
  academicYear: z
    .string()
    .trim()
    .min(1, 'Academic year is required.'),
  term: z.enum(['first_term', 'second_term', 'third_term']),
});

export type CreateResultCardBatchFormValues = z.output<typeof createResultCardBatchSchema>;
export type RedeemResultCardFormValues = z.output<typeof redeemResultCardSchema>;

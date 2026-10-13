import { z } from 'zod';

export const passwordRules = [
  { id: 'len', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordScore(password: string): number {
  return passwordRules.filter((r) => r.test(password)).length;
}

export const acceptInvitationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),

    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),

    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || val.replace(/[^0-9]/g, '').length >= 10,
        'Please enter a valid phone number (at least 10 digits)'
      ),

    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

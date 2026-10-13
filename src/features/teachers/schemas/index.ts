/**
 * Teachers Feature Validation Schemas
 */

import { z } from 'zod';

export const inviteTeacherSchema = z.object({
  classId: z
    .string({
      error: 'Please select a class',
    })
    .min(1, 'Please select a class'),
  email: z
    .string({
      error: 'Email address is required',
    })
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  name: z.string().optional(),
});

export type InviteTeacherFormSchema = z.infer<typeof inviteTeacherSchema>;

export * from './accept-invitation.schema';


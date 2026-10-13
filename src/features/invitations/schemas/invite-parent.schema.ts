import { z } from 'zod';

export const inviteParentSchema = z.object({
  email: z
    .string({
      error: 'Parent email address is required',
    })
    .trim()
    .min(1, 'Parent email address is required')
    .email('Please enter a valid email address'),
});

export type InviteParentFormSchema = z.infer<typeof inviteParentSchema>;

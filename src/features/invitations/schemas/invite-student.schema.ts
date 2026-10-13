import { z } from 'zod';

export const inviteStudentSchema = z.object({
  email: z
    .string({
      error: 'Student email address is required',
    })
    .trim()
    .min(1, 'Student email address is required')
    .email('Please enter a valid email address'),
  classId: z
    .string({
      error: 'Please select a class for the student',
    })
    .trim()
    .min(1, 'Please select a class for the student'),
});

export type InviteStudentFormSchema = z.infer<typeof inviteStudentSchema>;

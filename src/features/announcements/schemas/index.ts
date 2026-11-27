import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(150, 'Title must be 150 characters or fewer.'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(5000, 'Message must be 5000 characters or fewer.'),
  audiences: z
    .array(z.enum(['teacher', 'student', 'parent']))
    .min(1, 'Select at least one target audience.'),
});

export type CreateAnnouncementFormInput = z.input<typeof createAnnouncementSchema>;
export type CreateAnnouncementFormValues = z.output<typeof createAnnouncementSchema>;

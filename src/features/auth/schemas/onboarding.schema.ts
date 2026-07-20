import { z } from 'zod';


const phoneValidator = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[\d\s\-()]+$/, 'Phone number must contain only digits')
  .min(7, 'Phone number must be at least 7 digits');


export const schoolDetailsSchema = z.object({
  name: z
    .string()
    .min(1, 'School name is required')
    .min(2, 'School name must be at least 2 characters'),

  contactEmail: z
    .string()
    .min(1, 'Contact email is required')
    .pipe(z.email('Please enter a valid email address')),

  phone: phoneValidator,

  address: z
    .string()
    .min(1, 'Address is required')
    .min(5, 'Please enter a full street address'),

  city: z
    .string()
    .min(1, 'City is required')
    .min(2, 'Please enter a city'),

  state: z.string().min(1, 'Please select a state'),
});

// Step 2: School type 

export const schoolTypeSchema = z.object({
  schoolType: z.enum(['k12', 'college', 'district'], {
    error: 'Please select a school type',
  }),
});

// Step 3: Branding 

export const brandingSchema = z.object({
  /**
   * Cloudinary `secure_url` for the uploaded school logo.
   * Set after a successful upload; used for the sidebar preview.
   * Never sent to the school-creation API — stripped in auth.api.ts.
   *
   * During upload the BrandingStep shows a local data URL as a preview;
   * this field is only updated once the Cloudinary upload completes.
   */
  logoDataUrl: z.string().nullable().optional(),

  /**
   * Cloudinary `public_id` for the uploaded logo.
   * Persisted in RHF state (not component state) so it survives the
   * AnimatePresence unmount/remount when the user navigates between steps.
   * Used to delete the previous asset when the user replaces the logo.
   * Never sent to the school-creation API — stripped in auth.api.ts.
   */
  logoPublicId: z.string().nullable().optional(),
});

// Step 4: Academics

export const academicsSchema = z.object({
  academicYear:   z.string().min(1, 'Academic year is required'),
  gradingSystem:  z.enum(['letter', 'gpa', 'percent']),
  termStructure:  z.enum(['semester', 'trimester', 'quarter']),
  weekStart:      z.enum(['mon', 'tues', 'wed', 'thurs', 'fri'], {
    error: 'Please select a week start day',
  }),
  startTime:      z.string().min(1, 'Start time is required'),
  endTime:        z.string().min(1, 'End time is required'),
});

// Step 5: Administrator (base — no refinement, so merge works)

export const administratorBaseSchema = z.object({
  adminFullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),

  adminEmail: z
    .string()
    .min(1, 'Email address is required')
    .pipe(z.email('Please enter a valid email address')),

  adminPhone: phoneValidator,

  adminPassword: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),

  adminConfirmPassword: z.string().min(1, 'Please confirm your password'),
});


export const administratorSchema = administratorBaseSchema.refine(
  (d) => d.adminPassword === d.adminConfirmPassword,
  { message: 'Passwords do not match', path: ['adminConfirmPassword'] }
);

// Full merged schema

export const onboardingSchema = z
    .object({
      ...schoolDetailsSchema.shape,
      ...schoolTypeSchema.shape,
      ...brandingSchema.shape,
      ...academicsSchema.shape,
      ...administratorBaseSchema.shape,
    })
          .refine(
              (d) => d.adminPassword === d.adminConfirmPassword,
              { message: 'Passwords do not match', path: ['adminConfirmPassword'] }
          );

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

// Field map: which fields to trigger at each step 

export const STEP_FIELD_MAP = {
  1: ['name', 'contactEmail', 'phone', 'address', 'city', 'state'],
  2: ['schoolType'],
  3: [],   // branding optional
  4: ['academicYear', 'gradingSystem', 'termStructure', 'weekStart', 'startTime', 'endTime'],
  5: ['adminFullName', 'adminEmail', 'adminPhone', 'adminPassword', 'adminConfirmPassword'],
} satisfies Record<number, string[]>;

export const ONBOARDING_STEPS = [
  { id: 1, label: 'School details'  },
  { id: 2, label: 'School type'     },
  { id: 3, label: 'Branding'        },
  { id: 4, label: 'Academics'       },
  { id: 5, label: 'Administrator'   },
] as const;

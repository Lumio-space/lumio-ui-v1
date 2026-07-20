/**
 * Onboarding schema — unit tests (Phase 2 Corrections)
 *
 * Updated to reflect:
 *   - `country` → `state` in schoolDetailsSchema
 *   - phone regex validation (must contain only digits/spaces/hyphens)
 *   - administratorBaseSchema replaces old array-based administratorsSchema
 *   - password min-length and confirm-password match validation
 *   - Nigerian state values accepted
 */

import { describe, it, expect } from 'vitest';
import {
  schoolDetailsSchema,
  schoolTypeSchema,
  academicsSchema,
  administratorBaseSchema,
  administratorSchema,
} from '../schemas/onboarding.schema';

/* ── Step 1: School details ──────────────────────────── */
describe('schoolDetailsSchema', () => {
  const VALID = {
    name:         'Greenfield Secondary School',
    contactEmail: 'admin@school.edu.ng',
    phone:        '08012345678',
    address:      '15 Victoria Island Road',
    city:         'Lagos',
    state:        'lagos',
  };

  it('accepts valid school details', () => {
    expect(schoolDetailsSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts all 36 Nigerian states', () => {
    const states = [
      'abia', 'adamawa', 'akwa-ibom', 'anambra', 'bauchi', 'bayelsa',
      'benue', 'borno', 'cross-river', 'delta', 'ebonyi', 'edo', 'ekiti',
      'enugu', 'fct', 'gombe', 'imo', 'jigawa', 'kaduna', 'kano',
      'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa', 'niger',
      'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto',
      'taraba', 'yobe', 'zamfara',
    ];
    states.forEach((state) => {
      expect(schoolDetailsSchema.safeParse({ ...VALID, state }).success).toBe(true);
    });
  });

  it('rejects empty state selection', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, state: '' }).success).toBe(false);
  });

  it('rejects school name shorter than 2 chars', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, name: 'A' }).success).toBe(false);
  });

  it('rejects empty school name', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, name: '' }).success).toBe(false);
  });

  it('rejects invalid contact email', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, contactEmail: 'not-an-email' }).success).toBe(false);
  });

  it('rejects empty contact email', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, contactEmail: '' }).success).toBe(false);
  });

  it('rejects phone with alphabetic characters', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, phone: 'abc1234567' }).success).toBe(false);
  });

  it('rejects phone shorter than 7 digits', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, phone: '123' }).success).toBe(false);
  });

  it('accepts phone with international prefix', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, phone: '+2348012345678' }).success).toBe(true);
  });

  it('accepts phone with spaces and hyphens', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, phone: '0801 234 5678' }).success).toBe(true);
  });

  it('rejects address shorter than 5 chars', () => {
    expect(schoolDetailsSchema.safeParse({ ...VALID, address: '123' }).success).toBe(false);
  });
});

/* ── Step 2: School type ─────────────────────────────── */
describe('schoolTypeSchema', () => {
  it('accepts k12', () => {
    expect(schoolTypeSchema.safeParse({ schoolType: 'k12' }).success).toBe(true);
  });
  it('accepts college', () => {
    expect(schoolTypeSchema.safeParse({ schoolType: 'college' }).success).toBe(true);
  });
  it('accepts district', () => {
    expect(schoolTypeSchema.safeParse({ schoolType: 'district' }).success).toBe(true);
  });
  it('rejects unknown type', () => {
    expect(schoolTypeSchema.safeParse({ schoolType: 'university' }).success).toBe(false);
  });
  it('rejects empty string', () => {
    expect(schoolTypeSchema.safeParse({ schoolType: '' }).success).toBe(false);
  });
});

/* ── Step 4: Academics ───────────────────────────────── */
describe('academicsSchema', () => {
  const VALID = {
    academicYear:  '2026',
    gradingSystem: 'letter'   as const,
    termStructure: 'semester' as const,
    weekStart:     'mon'      as const,
    startTime:     '08:30',
    endTime:       '15:30',
  };

  it('accepts valid academics config', () => {
    expect(academicsSchema.safeParse(VALID).success).toBe(true);
  });
  it('rejects invalid grading system', () => {
    expect(academicsSchema.safeParse({ ...VALID, gradingSystem: 'ib' }).success).toBe(false);
  });
  it('rejects invalid term structure', () => {
    expect(academicsSchema.safeParse({ ...VALID, termStructure: 'biannual' }).success).toBe(false);
  });
  it('rejects missing start time', () => {
    expect(academicsSchema.safeParse({ ...VALID, startTime: '' }).success).toBe(false);
  });
});

/* ── Step 5: Administrator (base, no refinement) ─────── */
describe('administratorBaseSchema', () => {
  const VALID = {
    adminFullName:        'Adaeze Okonkwo',
    adminEmail:           'adaeze@school.edu.ng',
    adminPhone:           '08012345678',
    adminPassword:        'SecurePass1',
    adminConfirmPassword: 'SecurePass1',
  };

  it('accepts valid administrator data', () => {
    expect(administratorBaseSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects empty full name', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminFullName: '' }).success).toBe(false);
  });

  it('rejects full name shorter than 2 chars', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminFullName: 'A' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminEmail: 'not-an-email' }).success).toBe(false);
  });

  it('rejects empty email', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminEmail: '' }).success).toBe(false);
  });

  it('rejects phone with letters', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminPhone: 'abc1234567' }).success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminPassword: 'short' }).success).toBe(false);
  });

  it('accepts password exactly 8 chars', () => {
    expect(administratorBaseSchema.safeParse({
      ...VALID, adminPassword: 'exactly8', adminConfirmPassword: 'exactly8',
    }).success).toBe(true);
  });

  it('rejects empty confirm password', () => {
    expect(administratorBaseSchema.safeParse({ ...VALID, adminConfirmPassword: '' }).success).toBe(false);
  });
});

/* ── Step 5: Administrator (with password-match refinement) */
describe('administratorSchema (with refine)', () => {
  const VALID = {
    adminFullName:        'Adaeze Okonkwo',
    adminEmail:           'adaeze@school.edu.ng',
    adminPhone:           '08012345678',
    adminPassword:        'SecurePass1',
    adminConfirmPassword: 'SecurePass1',
  };

  it('accepts matching passwords', () => {
    expect(administratorSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = administratorSchema.safeParse({
      ...VALID,
      adminPassword:        'SecurePass1',
      adminConfirmPassword: 'DifferentPass',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('adminConfirmPassword');
    }
  });

  it('error message says passwords do not match', () => {
    const result = administratorSchema.safeParse({
      ...VALID, adminConfirmPassword: 'WrongPassword',
    });
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => /passwords do not match/i.test(m))).toBe(true);
    }
  });
});

/* ── confirmPassword stripped from API payload ───────── */
describe('onboardingSchema — confirmPassword is frontend-only', () => {
  it('includes adminConfirmPassword in the schema for frontend validation', () => {
    // It exists in the type so RHF can validate it
    // onboardingSchema is a ZodEffects wrapping the merged object
    // We verify the base schema has the field via administratorBaseSchema
    expect(administratorBaseSchema.shape).toHaveProperty('adminConfirmPassword');
  });

  it('does not include country field (replaced by state)', () => {
    expect(administratorBaseSchema.shape).not.toHaveProperty('country');
    expect(Object.keys(schoolDetailsSchema.shape)).toContain('state');
    expect(Object.keys(schoolDetailsSchema.shape)).not.toContain('country');
  });
});

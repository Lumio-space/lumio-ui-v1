/**
 * createSubjectSchema — unit tests
 *
 * Verifies validation behavior, including Senior Secondary department/type requirements,
 * and confirms Description is completely excluded from the schema.
 */

import { describe, it, expect } from 'vitest';
import { createSubjectSchema } from '../schemas';

describe('createSubjectSchema', () => {
  const VALID_PRIMARY = {
    name: 'Mathematics',
    code: 'MTH',
    section: 'Primary',
    status: 'Active' as const,
  };

  const VALID_SENIOR = {
    name: 'Physics',
    code: 'PHY',
    section: 'Senior Secondary',
    department: 'Science',
    type: 'Compulsory',
    status: 'Active' as const,
  };

  it('accepts valid primary subject data without department or type', () => {
    const result = createSubjectSchema.safeParse(VALID_PRIMARY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Mathematics');
      expect(result.data.code).toBe('MTH');
      expect(result.data.section).toBe('Primary');
      expect(result.data.status).toBe('Active');
      // Verify description is not in the schema output
      expect(result.data).not.toHaveProperty('description');
    }
  });

  it('accepts valid senior secondary subject data with department and type', () => {
    const result = createSubjectSchema.safeParse(VALID_SENIOR);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Physics');
      expect(result.data.code).toBe('PHY');
      expect(result.data.section).toBe('Senior Secondary');
      expect(result.data.department).toBe('Science');
      expect(result.data.type).toBe('Compulsory');
      expect(result.data).not.toHaveProperty('description');
    }
  });

  it('accepts All departments for Senior Secondary subjects', () => {
    const result = createSubjectSchema.safeParse({
      ...VALID_SENIOR,
      department: 'All departments',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.department).toBe('All departments');
    }
  });

  it('rejects empty subject name with friendly message', () => {
    const result = createSubjectSchema.safeParse({ ...VALID_PRIMARY, name: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('name'));
      expect(issue?.message).toBe('Subject name is required.');
    }
  });

  it('rejects empty subject code with friendly message', () => {
    const result = createSubjectSchema.safeParse({ ...VALID_PRIMARY, code: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('code'));
      expect(issue?.message).toBe('Subject code is required.');
    }
  });

  it('rejects code longer than 10 characters', () => {
    const result = createSubjectSchema.safeParse({ ...VALID_PRIMARY, code: 'VERYLONGCODE123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('code'));
      expect(issue?.message).toBe('Subject code must be 10 characters or fewer.');
    }
  });

  it('rejects empty section with friendly message', () => {
    const result = createSubjectSchema.safeParse({ ...VALID_PRIMARY, section: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('section'));
      expect(issue?.message).toBe('Select a school section.');
    }
  });

  it('rejects Senior Secondary subject without department', () => {
    const result = createSubjectSchema.safeParse({
      ...VALID_SENIOR,
      department: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('department'));
      expect(issue?.message).toBe('Select a department or track for Senior Secondary.');
    }
  });

  it('rejects Senior Secondary subject without type', () => {
    const result = createSubjectSchema.safeParse({
      ...VALID_SENIOR,
      type: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('type'));
      expect(issue?.message).toBe('Select Compulsory or Elective for Senior Secondary.');
    }
  });

  it('CRITICAL: completely ignores or strips description if passed', () => {
    const inputWithDescription = {
      ...VALID_PRIMARY,
      description: 'Introductory mathematics course description',
    };
    const result = createSubjectSchema.safeParse(inputWithDescription);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).description).toBeUndefined();
    }
  });
});

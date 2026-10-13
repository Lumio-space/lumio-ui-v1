import { describe, it, expect } from 'vitest';
import { inviteStudentSchema } from '../schemas/invite-student.schema';

describe('inviteStudentSchema', () => {
  it('validates a correct email address and classId', () => {
    const result = inviteStudentSchema.safeParse({
      email: 'student@example.com',
      classId: 'c1234567-89ab-cdef-0123-456789abcdef',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('student@example.com');
      expect(result.data.classId).toBe('c1234567-89ab-cdef-0123-456789abcdef');
    }
  });

  it('trims leading and trailing whitespace from email and classId', () => {
    const result = inviteStudentSchema.safeParse({
      email: '  student.trim@example.com  ',
      classId: '  class-123  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('student.trim@example.com');
      expect(result.data.classId).toBe('class-123');
    }
  });

  it('fails when classId is missing or empty', () => {
    const result = inviteStudentSchema.safeParse({
      email: 'student@example.com',
      classId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/please select a class for the student/i);
    }
  });

  it('fails when email is empty', () => {
    const result = inviteStudentSchema.safeParse({
      email: '',
      classId: 'class-123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/student email address is required/i);
    }
  });

  it('fails when email is invalid format', () => {
    const result = inviteStudentSchema.safeParse({
      email: 'not-an-email',
      classId: 'class-123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/valid email address/i);
    }
  });

  it('does not require any profile fields (strictly email and class context only)', () => {
    const shape = inviteStudentSchema.shape;
    const keys = Object.keys(shape);
    expect(keys.sort()).toEqual(['classId', 'email'].sort());
  });
});

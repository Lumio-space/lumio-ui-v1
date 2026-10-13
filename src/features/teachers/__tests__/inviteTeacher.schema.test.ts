import { describe, it, expect } from 'vitest';
import { inviteTeacherSchema } from '../schemas';

describe('inviteTeacherSchema', () => {
  const VALID = {
    classId: 'cls-123',
    email: 'sarah.connor@lumio.edu',
  };

  it('accepts valid input with classId and email', () => {
    const result = inviteTeacherSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('sarah.connor@lumio.edu');
      expect(result.data.classId).toBe('cls-123');
    }
  });

  it('accepts optional name if provided', () => {
    const result = inviteTeacherSchema.safeParse({
      ...VALID,
      name: 'Mrs. Sarah Connor',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Mrs. Sarah Connor');
    }
  });

  it('rejects empty classId', () => {
    const result = inviteTeacherSchema.safeParse({ ...VALID, classId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/select a class/i);
    }
  });

  it('rejects missing or empty email', () => {
    const result = inviteTeacherSchema.safeParse({ ...VALID, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/email address is required/i);
    }
  });

  it('rejects invalid email address', () => {
    const result = inviteTeacherSchema.safeParse({ ...VALID, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/valid email/i);
    }
  });
});

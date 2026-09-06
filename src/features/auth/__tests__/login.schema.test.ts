/**
 * Login schema — unit tests
 */

import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/features/auth/schemas/login.schema';

describe('loginSchema', () => {
  // rememberMe is z.boolean() — must be present in the payload
  const VALID = { email: 'sarah@lumio.edu', password: 'secret123', rememberMe: false };

  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ ...VALID, email: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msgs = r.error.issues.map((i) => i.message);
      expect(msgs.some((m) => /email|required/i.test(m))).toBe(true);
    }
  });

  it('rejects malformed email', () => {
    expect(loginSchema.safeParse({ ...VALID, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ ...VALID, password: '' }).success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    expect(loginSchema.safeParse({ ...VALID, password: 'abc1234' }).success).toBe(false);
  });

  it('accepts password exactly 8 characters', () => {
    expect(loginSchema.safeParse({ ...VALID, password: 'abc12345' }).success).toBe(true);
  });

  it('accepts rememberMe: false', () => {
    expect(loginSchema.safeParse({ ...VALID, rememberMe: false }).success).toBe(true);
  });

  it('accepts rememberMe: true', () => {
    expect(loginSchema.safeParse({ ...VALID, rememberMe: true }).success).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { acceptInvitationSchema } from '../schemas/accept-invitation.schema';

describe('acceptInvitationSchema', () => {
  const VALID = {
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+2348012345678',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('accepts valid input with all required fields', () => {
    const result = acceptInvitationSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Jane');
      expect(result.data.lastName).toBe('Doe');
      expect(result.data.phone).toBe('+2348012345678');
      expect(result.data.password).toBe('password123');
    }
  });

  it('rejects empty or missing firstName', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      firstName: '   ',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/first name is required/i);
    }
  });

  it('rejects firstName shorter than 2 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      firstName: 'J',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 2 characters/i);
    }
  });

  it('rejects empty or missing lastName', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      lastName: '   ',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/last name is required/i);
    }
  });

  it('rejects lastName shorter than 2 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      lastName: 'D',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 2 characters/i);
    }
  });

  it('accepts valid input without phone (phone is optional in backend contract)', () => {
    const { phone: _phone, ...withoutPhone } = VALID;
    const result = acceptInvitationSchema.safeParse(withoutPhone);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with empty string phone', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      phone: '   ',
    });
    expect(result.success).toBe(true);
  });

  it('rejects phone number with fewer than 10 digits when provided', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      phone: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 10 digits/i);
    }
  });

  it('rejects empty password', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      password: '',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/password is required/i);
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 8 characters/i);
    }
  });

  it('rejects mismatched password and confirmPassword', () => {
    const result = acceptInvitationSchema.safeParse({
      ...VALID,
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/passwords do not match/i);
    }
  });
});

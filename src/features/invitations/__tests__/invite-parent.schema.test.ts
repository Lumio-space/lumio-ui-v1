import { describe, it, expect } from 'vitest';
import { inviteParentSchema } from '../schemas/invite-parent.schema';

describe('inviteParentSchema', () => {
  it('validates a correct email address', () => {
    const result = inviteParentSchema.safeParse({
      email: 'parent@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('parent@example.com');
    }
  });

  it('trims leading and trailing whitespace from email', () => {
    const result = inviteParentSchema.safeParse({
      email: '  parent.trim@example.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('parent.trim@example.com');
    }
  });

  it('fails when email is empty', () => {
    const result = inviteParentSchema.safeParse({
      email: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/parent email address is required/i);
    }
  });

  it('fails when email is invalid format', () => {
    const result = inviteParentSchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/valid email address/i);
    }
  });

  it('does not require any profile fields (strictly email only)', () => {
    // Only email is defined in the schema
    const shape = inviteParentSchema.shape;
    const keys = Object.keys(shape);
    expect(keys).toEqual(['email']);
  });
});

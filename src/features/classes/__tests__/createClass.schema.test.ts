/**
 * createClassSchema — unit tests
 */

import { describe, it, expect } from 'vitest';
import { createClassSchema } from '../schemas';

describe('createClassSchema', () => {
  const VALID = {
    schoolLevel: 'primary',
    gradeLevel: 'Primary 1',
    gradeSection: 'A',
    room: 101,
    capacity: 35,
  };

  it('accepts valid numbers for room and capacity', () => {
    const result = createClassSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.room).toBe(101);
      expect(typeof result.data.room).toBe('number');
      expect(result.data.capacity).toBe(35);
      expect(typeof result.data.capacity).toBe('number');
    }
  });

  it('coerces valid numeric strings into numbers', () => {
    const result = createClassSchema.safeParse({
      ...VALID,
      room: '204',
      capacity: '40',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.room).toBe(204);
      expect(typeof result.data.room).toBe('number');
      expect(result.data.capacity).toBe(40);
      expect(typeof result.data.capacity).toBe('number');
    }
  });

  it('rejects empty room with friendly message', () => {
    const result = createClassSchema.safeParse({ ...VALID, room: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Please enter a room number.');
    }
  });

  it('rejects undefined room with friendly message', () => {
    const result = createClassSchema.safeParse({ ...VALID, room: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Please enter a room number.');
    }
  });

  it('rejects non-numeric string for room', () => {
    const result = createClassSchema.safeParse({ ...VALID, room: 'Room 101' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Please enter a room number.');
    }
  });

  it('rejects room <= 0', () => {
    const zeroResult = createClassSchema.safeParse({ ...VALID, room: 0 });
    expect(zeroResult.success).toBe(false);
    if (!zeroResult.success) {
      const issue = zeroResult.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Room number must be greater than 0.');
    }

    const negResult = createClassSchema.safeParse({ ...VALID, room: -5 });
    expect(negResult.success).toBe(false);
    if (!negResult.success) {
      const issue = negResult.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Room number must be greater than 0.');
    }
  });

  it('rejects decimal room number', () => {
    const result = createClassSchema.safeParse({ ...VALID, room: 101.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('room'));
      expect(issue?.message).toBe('Room number must be a whole number.');
    }
  });

  it('rejects empty capacity with friendly message', () => {
    const result = createClassSchema.safeParse({ ...VALID, capacity: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Please enter class capacity.');
    }
  });

  it('rejects undefined capacity with friendly message', () => {
    const result = createClassSchema.safeParse({ ...VALID, capacity: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Please enter class capacity.');
    }
  });

  it('rejects non-numeric string for capacity', () => {
    const result = createClassSchema.safeParse({ ...VALID, capacity: 'thirty' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Please enter class capacity.');
    }
  });

  it('rejects capacity <= 0', () => {
    const zeroResult = createClassSchema.safeParse({ ...VALID, capacity: 0 });
    expect(zeroResult.success).toBe(false);
    if (!zeroResult.success) {
      const issue = zeroResult.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Capacity must be greater than 0.');
    }

    const negResult = createClassSchema.safeParse({ ...VALID, capacity: -10 });
    expect(negResult.success).toBe(false);
    if (!negResult.success) {
      const issue = negResult.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Capacity must be greater than 0.');
    }
  });

  it('rejects decimal capacity', () => {
    const result = createClassSchema.safeParse({ ...VALID, capacity: 35.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('capacity'));
      expect(issue?.message).toBe('Capacity must be a whole number.');
    }
  });
});

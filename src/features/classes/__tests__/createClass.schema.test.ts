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

  describe('department validation per school level', () => {
    it('accepts Senior Secondary with department Science, Arts, or Commercial', () => {
      const resultScience = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'senior_secondary',
        gradeLevel: 'SSS1',
        department: 'Science',
      });
      expect(resultScience.success).toBe(true);

      const resultArts = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'senior_secondary',
        gradeLevel: 'SSS1',
        department: 'Arts',
      });
      expect(resultArts.success).toBe(true);

      const resultCommercial = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'senior_secondary',
        gradeLevel: 'SSS1',
        department: 'Commercial',
      });
      expect(resultCommercial.success).toBe(true);
    });

    it('rejects Senior Secondary when department is missing or empty', () => {
      const emptyResult = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'senior_secondary',
        gradeLevel: 'SSS1',
        department: '',
      });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        const issue = emptyResult.error.issues.find((i) => i.path.includes('department'));
        expect(issue?.message).toBe('Please select a department for Senior Secondary.');
      }

      const missingResult = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'senior_secondary',
        gradeLevel: 'SSS1',
      });
      expect(missingResult.success).toBe(false);
      if (!missingResult.success) {
        const issue = missingResult.error.issues.find((i) => i.path.includes('department'));
        expect(issue?.message).toBe('Please select a department for Senior Secondary.');
      }
    });

    it('accepts Primary/Nursery/Junior Secondary without department', () => {
      const resultPrimary = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'primary',
        department: '',
      });
      expect(resultPrimary.success).toBe(true);

      const resultNursery = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'nursery',
        gradeLevel: 'nursery1',
      });
      expect(resultNursery.success).toBe(true);
    });

    it('rejects Primary/Nursery/Junior Secondary when department is provided', () => {
      const result = createClassSchema.safeParse({
        ...VALID,
        schoolLevel: 'primary',
        department: 'Science',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('department'));
        expect(issue?.message).toBe('Department can only be set for senior secondary classes.');
      }
    });
  });
});


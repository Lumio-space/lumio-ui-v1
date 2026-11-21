import type { StudentStatus } from '../types';

export const studentQueryKeys = {
  all: ['students'] as const,
  lists: () => [...studentQueryKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...studentQueryKeys.lists(), params ?? {}] as const,
  details: () => [...studentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentQueryKeys.details(), id] as const,
};

export const studentStatusTone: Record<StudentStatus, 'green' | 'slate' | 'purple'> = {
  Active: 'green',
  Inactive: 'slate',
  Graduated: 'purple',
};

export const DEFAULT_GRADES = [
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SSS 1',
  'SSS 2',
  'SSS 3',
];

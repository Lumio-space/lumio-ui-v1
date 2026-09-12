import type { SchoolLevel, GradeLevel } from '../types';

export interface GradeLevelOption {
  label: string;
  value: GradeLevel;
}

export const SCHOOL_LEVELS: Array<{ label: string; value: SchoolLevel }> = [
  { label: 'Nursery',          value: 'nursery'          },
  { label: 'Primary',          value: 'primary'          },
  { label: 'Junior Secondary', value: 'junior_secondary' },
  { label: 'Senior Secondary', value: 'senior_secondary' },
];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  nursery:          'Nursery',
  primary:          'Primary',
  junior_secondary: 'Junior Secondary',
  senior_secondary: 'Senior Secondary',
};

/** Badge tone per school level — uses the shared Badge component's tone names */
export const SCHOOL_LEVEL_TONES: Record<SchoolLevel, 'indigo' | 'purple' | 'gold' | 'green'> = {
  nursery:          'green',
  primary:          'indigo',
  junior_secondary: 'gold',
  senior_secondary: 'purple',
};

export const GRADE_LEVEL_LABELS: Record<string, string> = {
  nursery1:         'Nursery 1',
  nursery2:         'Nursery 2',
  kindergarten:     'Kindergarten',
  'Primary 1':      'Primary 1',
  'Primary 2':      'Primary 2',
  'Primary 3':      'Primary 3',
  'Primary 4':      'Primary 4',
  'Primary 5':      'Primary 5',
  'Primary 6':      'Primary 6',
  'JSS 1':          'JSS 1',
  'JSS 2':          'JSS 2',
  'JSS 3':          'JSS 3',
  'SSS 1':          'SSS 1',
  'SSS 2':          'SSS 2',
  'SSS 3':          'SSS 3',
};

/**
 * Grade levels per school level.
 * Values must match the backend classGradeEnum exactly:
 * "nursery1", "nursery2", "kindergarten", "Primary 1".."Primary 6", "JSS 1".."JSS 3", "SSS 1".."SSS 3".
 */
export const GRADE_LEVELS: Record<SchoolLevel, GradeLevelOption[]> = {
  nursery: [
    { label: 'Nursery 1',    value: 'nursery1' },
    { label: 'Nursery 2',    value: 'nursery2' },
    { label: 'Kindergarten', value: 'kindergarten' },
  ],
  primary: [
    { label: 'Primary 1', value: 'Primary 1' },
    { label: 'Primary 2', value: 'Primary 2' },
    { label: 'Primary 3', value: 'Primary 3' },
    { label: 'Primary 4', value: 'Primary 4' },
    { label: 'Primary 5', value: 'Primary 5' },
    { label: 'Primary 6', value: 'Primary 6' },
  ],
  junior_secondary: [
    { label: 'JSS 1', value: 'JSS 1' },
    { label: 'JSS 2', value: 'JSS 2' },
    { label: 'JSS 3', value: 'JSS 3' },
  ],
  senior_secondary: [
    { label: 'SSS 1', value: 'SSS 1' },
    { label: 'SSS 2', value: 'SSS 2' },
    { label: 'SSS 3', value: 'SSS 3' },
  ],
};

/**
 * Class sections / arms.
 * Values must match the backend classSectionEnum exactly.
 */
export const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E'];

/** TanStack Query key factory */
export const classQueryKeys = {
  all:   ['classes'] as const,
  lists: () => [...classQueryKeys.all, 'list'] as const,
};

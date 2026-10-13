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
  nursery3:         'Nursery 3',
  kindergarten:     'Kindergarten',
  Primary1:         'Primary 1',
  Primary2:         'Primary 2',
  Primary3:         'Primary 3',
  Primary4:         'Primary 4',
  Primary5:         'Primary 5',
  Primary6:         'Primary 6',
  JSS1:             'JSS 1',
  JSS2:             'JSS 2',
  JSS3:             'JSS 3',
  SSS1:             'SSS 1',
  SSS2:             'SSS 2',
  SSS3:             'SSS 3',
  // Backwards compatibility with spaced strings
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
 * Values match backend enum exactly:
 * "nursery1", "nursery2", "nursery3", "Primary1".."Primary6", "JSS1".."JSS3", "SSS1".."SSS3".
 */
export const GRADE_LEVELS: Record<SchoolLevel, GradeLevelOption[]> = {
  nursery: [
    { label: 'Nursery 1', value: 'nursery1' },
    { label: 'Nursery 2', value: 'nursery2' },
    { label: 'Nursery 3', value: 'nursery3' },
  ],
  primary: [
    { label: 'Primary 1', value: 'Primary1' },
    { label: 'Primary 2', value: 'Primary2' },
    { label: 'Primary 3', value: 'Primary3' },
    { label: 'Primary 4', value: 'Primary4' },
    { label: 'Primary 5', value: 'Primary5' },
    { label: 'Primary 6', value: 'Primary6' },
  ],
  junior_secondary: [
    { label: 'JSS 1', value: 'JSS1' },
    { label: 'JSS 2', value: 'JSS2' },
    { label: 'JSS 3', value: 'JSS3' },
  ],
  senior_secondary: [
    { label: 'SSS 1', value: 'SSS1' },
    { label: 'SSS 2', value: 'SSS2' },
    { label: 'SSS 3', value: 'SSS3' },
  ],
};

/**
 * Class sections / arms.
 * Values must match the backend classSectionEnum exactly.
 */
export const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export const DEPARTMENTS = ['Science', 'Arts', 'Commercial'] as const;

export const DEPARTMENT_TONES: Record<'Science' | 'Arts' | 'Commercial', 'green' | 'purple' | 'gold'> = {
  Science: 'green',
  Arts: 'purple',
  Commercial: 'gold',
};

/** Senior Secondary is the only section that carries a department */
export function sectionHasDepartment(section?: string | null): boolean {
  if (!section) return false;
  return section === 'senior_secondary' || section === 'Senior Secondary';
}

/** Composes the display name from its parts, e.g. "SS2 Science A" or "Primary 1 A". */
export function composeClassName(
  level: string,
  department?: string | null,
  letter?: string | null,
): string {
  const dept = department && department !== 'Nill' ? department : '';
  const parts = [level, dept, letter || ''].filter(Boolean);
  return parts.join(' ');
}

/** TanStack Query key factory */
export const classQueryKeys = {
  all:   ['classes'] as const,
  lists: () => [...classQueryKeys.all, 'list'] as const,
};


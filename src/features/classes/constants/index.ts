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

const LEVEL_SORT_ORDER: Record<string, number> = {
  nursery: 0,
  primary: 1,
  junior_secondary: 2,
  juniorsecondary: 2,
  senior_secondary: 3,
  seniorsecondary: 3,
};

function normalizeLevelSortKey(level?: string | null, grade?: string | null): number {
  const rawLevel = (level || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (rawLevel && rawLevel in LEVEL_SORT_ORDER) {
    return LEVEL_SORT_ORDER[rawLevel];
  }
  const g = (grade || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (g.startsWith('nursery') || g.includes('kindergarten')) return 0;
  if (g.startsWith('primary') || g.includes('basic')) return 1;
  if (g.startsWith('jss') || g.includes('junior')) return 2;
  if (g.startsWith('sss') || g.startsWith('ss') || g.includes('senior')) return 3;
  return 99;
}

/**
 * Returns true if a class record is active (not soft-deleted).
 */
export function isActiveClass(cls: { deletedAt?: string | null } | null | undefined): boolean {
  if (!cls) return false;
  return cls.deletedAt === undefined || cls.deletedAt === null || cls.deletedAt === '';
}

/**
 * Filters out soft-deleted class records (where deletedAt is non-null).
 */
export function filterActiveClasses<T extends { deletedAt?: string | null }>(items: T[]): T[] {
  return items.filter(isActiveClass);
}

/**
 * Normalizes any supported class list response shape (array, { data }, { classes }, { items })
 * and excludes soft-deleted class records.
 */
export function extractActiveClasses<T extends { deletedAt?: string | null }>(raw: unknown): T[] {
  let list: T[] = [];
  if (Array.isArray(raw)) {
    list = raw as T[];
  } else if (raw && typeof raw === 'object') {
    const wrapped = raw as { data?: unknown; classes?: unknown; items?: unknown };
    if (Array.isArray(wrapped.data)) list = wrapped.data as T[];
    else if (Array.isArray(wrapped.classes)) list = wrapped.classes as T[];
    else if (Array.isArray(wrapped.items)) list = wrapped.items as T[];
  }
  return filterActiveClasses(list);
}

/**
 * Sorts classes deterministically by:
 *   1. School level (Nursery → Primary → Junior Secondary → Senior Secondary)
 *   2. Numeric grade (e.g. JSS 1 → JSS 2 → JSS 3)
 *   3. Department where applicable (excluding 'Nill')
 *   4. Alphabetical section/arm (A → B → C)
 */
export function sortClassesSerially<
  T extends {
    id?: string;
    level?: string | null;
    grade?: string | null;
    department?: string | null;
    section?: string | null;
  },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const levelDiff =
      normalizeLevelSortKey(a.level, a.grade) - normalizeLevelSortKey(b.level, b.grade);
    if (levelDiff !== 0) return levelDiff;

    const gradeA = (a.grade ? GRADE_LEVEL_LABELS[a.grade] ?? a.grade : '').trim();
    const gradeB = (b.grade ? GRADE_LEVEL_LABELS[b.grade] ?? b.grade : '').trim();
    const gradeDiff = gradeA.localeCompare(gradeB, undefined, { numeric: true, sensitivity: 'base' });
    if (gradeDiff !== 0) return gradeDiff;

    const deptA = a.department && a.department !== 'Nill' ? a.department : '';
    const deptB = b.department && b.department !== 'Nill' ? b.department : '';
    const deptDiff = deptA.localeCompare(deptB, undefined, { sensitivity: 'base' });
    if (deptDiff !== 0) return deptDiff;

    const secDiff = (a.section || '').localeCompare(b.section || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (secDiff !== 0) return secDiff;

    return (a.id || '').localeCompare(b.id || '');
  });
}


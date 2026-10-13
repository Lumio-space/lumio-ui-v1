import type {
  SchoolSection,
  Department,
  SubjectDepartment,
  SubjectType,
  SubjectRecord,
} from '../types';

export const SCHOOL_SECTIONS: SchoolSection[] = [
  'Nursery',
  'Primary',
  'Junior Secondary',
  'Senior Secondary',
];

export const DEPARTMENTS: Department[] = ['Science', 'Arts', 'Commercial'];

export const SUBJECT_DEPARTMENTS: SubjectDepartment[] = [
  'Science',
  'Arts',
  'Commercial',
  'All departments',
];

export const SUBJECT_TYPES: SubjectType[] = ['Compulsory', 'Elective'];

export const sectionTone: Record<
  SchoolSection,
  'purple' | 'indigo' | 'gold' | 'slate'
> = {
  Nursery: 'gold',
  Primary: 'purple',
  'Junior Secondary': 'indigo',
  'Senior Secondary': 'slate',
};

export const departmentTone: Record<Department, 'green' | 'purple' | 'gold'> = {
  Science: 'green',
  Arts: 'purple',
  Commercial: 'gold',
};

export function subjectDepartmentTone(
  d: SubjectDepartment,
): 'green' | 'purple' | 'gold' | 'indigo' {
  if (d === 'Science') return 'green';
  if (d === 'Arts') return 'purple';
  if (d === 'Commercial') return 'gold';
  return 'indigo';
}

/** Senior Secondary is the only section that carries a department */
export function sectionHasDepartment(section?: string | null): boolean {
  if (!section) return false;
  return section === 'Senior Secondary' || section === 'senior_secondary';
}

/** True when the admin still has configuration to complete on this subject */
export function subjectNeedsConfig(subject: SubjectRecord): boolean {
  return (
    sectionHasDepartment(subject.section) &&
    (!subject.department || !subject.type)
  );
}

/** TanStack Query keys */
export const subjectQueryKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...subjectQueryKeys.all, 'detail', id] as const,
  offerings: () => [...subjectQueryKeys.all, 'offerings'] as const,
};

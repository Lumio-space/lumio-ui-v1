import type { ResultGrade, ResultStatus, ResultTerm } from '../types';

export const RESULT_TERMS: ReadonlyArray<{ value: ResultTerm; label: string }> = [
  { value: 'first_term', label: 'First Term' },
  { value: 'second_term', label: 'Second Term' },
  { value: 'third_term', label: 'Third Term' },
] as const;

export const TERM_LABELS: Record<ResultTerm, string> = {
  first_term: 'First Term',
  second_term: 'Second Term',
  third_term: 'Third Term',
};

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  not_started: 'Not started',
  draft: 'Draft',
  published: 'Published',
};

export const RESULT_STATUS_TONES: Record<ResultStatus, 'slate' | 'gold' | 'green'> = {
  not_started: 'slate',
  draft: 'gold',
  published: 'green',
};

export const GRADE_TONES: Record<ResultGrade, 'green' | 'blue' | 'gold' | 'red'> = {
  A: 'green',
  B: 'blue',
  C: 'gold',
  D: 'gold',
  E: 'gold',
  F: 'red',
};

export function getDefaultAcademicYear(): string {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
}

export const resultQueryKeys = {
  all: ['results'] as const,
  classResults: (classId: string, academicYear: string, term: ResultTerm) =>
    [...resultQueryKeys.all, 'class', classId, academicYear, term] as const,
  batchCards: (batchId: string) =>
    [...resultQueryKeys.all, 'batch-cards', batchId] as const,
};

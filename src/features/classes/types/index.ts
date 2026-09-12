/**
 * Class types — aligned with the actual backend response shape.
 *
 * The backend stores and returns columns as:
 *   grade   (frontend: gradeLevel in DTOs)
 *   section (frontend: gradeSection in DTOs)
 *   level   (frontend: schoolLevel in DTOs)
 *
 * The GET /classes/ response uses the Drizzle column names, not DTO names.
 */

export type SchoolLevel =
  | 'nursery'
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary';

/** Shape returned by GET /classes/ — Drizzle column names */
export interface ClassRecord {
  id:           string;
  schoolId:     string;
  grade:        string;   // e.g. "Primary 1"
  section:      string;   // e.g. "A"
  level:        string;   // e.g. "primary"
  capacity:     number;
  room:         number;
  formTeacher?: string | null;
  teacher?:     string;
  students?:    number;
  subjects?:    string[];
  createdAt:    string;
  updatedAt?:   string;
}

export type GradeLevel =
  | 'nursery1'
  | 'nursery2'
  | 'kindergarten'
  | 'Primary 1'
  | 'Primary 2'
  | 'Primary 3'
  | 'Primary 4'
  | 'Primary 5'
  | 'Primary 6'
  | 'JSS 1'
  | 'JSS 2'
  | 'JSS 3'
  | 'SSS 1'
  | 'SSS 2'
  | 'SSS 3';

/**
 * Create class payload — matches CreateClassDto field names exactly.
 * These are the DTO field names, not the DB column names.
 */
export interface CreateClassPayload {
  gradeLevel:   GradeLevel | string;
  gradeSection: string;
  schoolLevel:  SchoolLevel;
  capacity:     number;
  room:         number;
}

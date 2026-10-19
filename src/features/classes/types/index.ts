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

export type Department = 'Science' | 'Arts' | 'Commercial' | 'Nill';

/** Shape returned by GET /classes/ — Drizzle column names */
export type ClassRecord = {
  id:           string;
  schoolId:     string;
  grade:        string;   // e.g. "Primary 1"
  section:      string;   // e.g. "A"
  level:        string;   // e.g. "primary"
  capacity:     number;
  room:         number;
  department?:      Department | null;
  formTeacher?:     string | null;
  formTeacherName?: string | null;
  teacher?:         string;
  students?:        number;
  subjects?:    string[];
  createdAt:    string;
  updatedAt?:   string;
};

export type GradeLevel =
  | 'nursery1'
  | 'nursery2'
  | 'nursery3'
  | 'Primary1'
  | 'Primary2'
  | 'Primary3'
  | 'Primary4'
  | 'Primary5'
  | 'Primary6'
  | 'JSS1'
  | 'JSS2'
  | 'JSS3'
  | 'SSS1'
  | 'SSS2'
  | 'SSS3'
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
export type CreateClassPayload = {
  gradeLevel:   GradeLevel | string;
  gradeSection: string;
  schoolLevel:  SchoolLevel;
  capacity:     number;
  room:         number;
  department?:  Department;
};

export type UpdateClassPayload = {
  gradeLevel?:   GradeLevel | string;
  gradeSection?: string;
  schoolLevel?:  SchoolLevel;
  capacity?:     number;
  room?:         number;
  department?:   Department;
};


/**
 * Subject Management Types
 *
 * Migrated from lumio-react src/lib/subjects.ts.
 * Note: Per explicit product requirements, description has been completely
 * removed from Subject creation and CreateSubjectPayload.
 */

export type SchoolSection =
  | 'Nursery'
  | 'Primary'
  | 'Junior Secondary'
  | 'Senior Secondary';

/** Senior Secondary track. Admin-selected, never inferred. */
export type Department = 'Science' | 'Arts' | 'Commercial';

export type SubjectStatus = 'Active' | 'Inactive';

/** Admin-selected classification for Senior Secondary. */
export type SubjectType = 'Compulsory' | 'Elective';

/** A subject can be scoped to one track, or offered across both. */
export type SubjectDepartment = Department | 'All departments';

export interface SubjectOffering {
  id: string;
  subjectId: string;
  classId: string;
  teacherIds: string[];
}

export interface SubjectRecord {
  id: string;
  schoolId?: string;
  name: string;
  code: string;
  section: SchoolSection;
  /** Senior Secondary only. Undefined = not configured by the admin yet. */
  department?: SubjectDepartment;
  /** Senior Secondary only. Undefined = not configured yet. */
  type?: SubjectType;
  status: SubjectStatus;
  createdOn: string;
  createdAt?: string;
  updatedAt?: string;
  classIds?: string[];
  offerings?: SubjectOffering[];
}

/**
 * Payload for subject creation.
 * NOTE: Description is explicitly NOT part of this payload.
 */
export interface CreateSubjectPayload {
  name: string;
  code: string;
  section: SchoolSection;
  department?: SubjectDepartment;
  type?: SubjectType;
  status: SubjectStatus;
  classIds?: string[];
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  section?: SchoolSection;
  department?: SubjectDepartment;
  type?: SubjectType;
  status?: SubjectStatus;
  classIds?: string[];
}

export interface AssignClassesPayload {
  classIds: string[];
}

export interface AssignTeacherPayload {
  teacherId: string | null;
  classId: string;
  subjectId: string;
}

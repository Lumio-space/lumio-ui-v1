/**
 * Student Feature Types
 *
 * Aligned with lumio-react design and backend student contracts.
 */

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated';

export interface StudentRecord {
  id: string;
  userId?: string;
  name: string;
  fullName: string;
  admissionNo: string;
  grade: string;
  section: string;
  classId?: string;
  className?: string;
  rollNo: number;
  gender: string;
  status: StudentStatus;
  attendance: number;
  average: number;
  parent: string;
  parentPhone: string;
  parentEmail?: string;
  email: string;
  phone?: string;
  avatar?: string;
  joined: string;
}

export interface FetchStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  status?: string;
  classId?: string;
}

export interface StudentsListResponse {
  data: StudentRecord[];
  total: number;
  page?: number;
  limit?: number;
}

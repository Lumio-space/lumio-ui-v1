/**
 * Parents Feature Types
 *
 * Aligned with lumio-react design and backend parent directory contracts.
 */

export interface ParentChildRecord {
  studentId: string;
  studentUserId?: string;
  studentName: string;
  studentStatus?: string;
  classId?: string | null;
  grade?: string | null;
  section?: string | null;
  className?: string;
  relationship?: string;
  isPrimary?: boolean;
  avatar?: string;
}

export interface ParentRecord {
  id: string;
  parentId?: string;
  membershipId?: string;
  userId?: string;
  name: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  joinedAt?: string;
  avatar?: string;
  children: ParentChildRecord[];
}

export interface FetchParentsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParentsListResponse {
  data: ParentRecord[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ChildSubjectResult {
  subject: string;
  score: number;
  grade: string;
  tone: 'green' | 'blue' | 'gold' | 'red';
}

export interface EnrichedChildRecord {
  id: string;
  studentId: string;
  name: string;
  admissionNo: string;
  rollNo?: number;
  grade: string;
  section: string;
  classId?: string | null;
  className: string;
  status: string;
  attendance: number;
  average: number;
  avatar?: string;
  relationship?: string;
  formTeacher?: {
    id?: string;
    name?: string;
    email?: string;
  };
  subjects?: string[];
  results?: ChildSubjectResult[];
  schedule?: Array<{
    time: string;
    subject: string;
    room?: string;
  }>;
}


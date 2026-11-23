import type { Role } from '@/types/auth.types';

export interface PendingInvitation {
  id: string;
  schoolId: string;
  schoolName: string;
  role: Role | string;
  assignmentType?: string;
  classId?: string;
  status?: string;
  expiresAt?: string;
  createdAt?: string;
  token?: string;
}

export interface LoginResponse {
  token?:       string;
  accessToken?: string;
  refreshToken?: string;
  user: {
    id:         string;
    name?:      string;
    fullName?:  string;
    email:      string;
    role?:      Role;
    avatarUrl?: string;
    schoolId?:  string;
    classId?:   string;
  };
  memberships?: Array<{
    schoolId:   string;
    role:       Role | string;
    schoolName: string;
    status:     string;
    classId?:   string;
  }>;
  pendingInvitations?: PendingInvitation[];
}

export interface OnboardingResponse {
  schoolId:  string;
  schoolName: string;
  token:     string;
}

/** Shape of the API error response */
export interface ApiError {
  message: string;
  code?:   string;
  field?:  string;
}

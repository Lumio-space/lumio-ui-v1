import type { Role } from '@/types/auth.types';

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
  };
  memberships?: Array<{
    schoolId:   string;
    role:       Role | string;
    schoolName: string;
    status:     string;
  }>;
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

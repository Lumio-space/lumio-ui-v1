import type { Role } from '@/types/auth.types';

export interface LoginResponse {
  token: string;
  user: {
    id:        string;
    name:      string;
    email:     string;
    role:      Role;
    avatarUrl?: string;
  };
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

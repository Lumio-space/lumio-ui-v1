/**
 * Invitations Feature Types
 *
 * Covers invitation creation and acceptance flows for teachers, students, and parents.
 * Aligned with backend contracts in lumio-api-v1-main and UI specifications from lumio-react.
 */

export type InviteRole = 'teacher' | 'student' | 'parent';
export type InviteState = 'valid' | 'expired' | 'invalid' | 'used';
export type InviteStatus = 'Pending' | 'Accepted' | 'Declined' | 'Expired';
export type BackendInviteStatus = 'pending' | 'viewed' | 'accepted' | 'expired' | 'revoked';

/** Backend DTO for POST /invites/parents */
export interface InviteParentPayload {
  email: string;
}

/** Response from POST /invites/parents */
export interface InviteParentResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  token?: string;
}

/** Backend DTO for POST /invites/students */
export interface InviteStudentPayload {
  email: string;
  classId: string;
}

/** Response from POST /invites/students */
export interface InviteStudentResponse {
  id: string;
  email: string;
  role: string;
  classId?: string;
  status: string;
  token?: string;
}

/** Backend DTO for POST /invites/teachers */
export interface InviteTeacherPayload {
  email: string;
  classId: string;
}

/** Response from POST /invites/teachers */
export interface InviteTeacherResponse {
  id: string;
  email: string;
  role: string;
  classId: string;
  status: string;
  token?: string;
}

/** Response from GET /invites/accept?token=... */
export interface ValidateInvitationResponse {
  email: string;
  isExistingUser: boolean;
  role: string;
  token: string;
  schoolId?: string;
  schoolName?: string;
  schoolLocation?: string;
  schoolLogo?: string;
  schoolInitials?: string;
  inviterName?: string;
  inviterRole?: string;
  inviteeName?: string;
  message?: string;
  assignmentType?: 'none' | 'form_teacher' | 'subject_teacher' | string;
  classId?: string;
  class?: {
    id: string;
    grade: string;
    section: string;
    department?: string;
  };
  studentId?: string;
  expiresAt?: string;
  status?: 'pending' | 'viewed' | 'accepted' | 'expired' | 'revoked' | string;
}

/** Payload for POST /invites/register */
export interface AcceptInvitationPayload {
  token: string;
  fullName: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/** Response from POST /invites/register */
export interface AcceptInvitationResult {
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
  };
  role: string;
  schoolId: string;
  classId?: string;
  accessToken?: string;
  refreshToken?: string;
}

/** Payload for POST /invites/accept-existing */
export interface AcceptExistingPayload {
  token: string;
}

/** Response from POST /invites/accept-existing */
export interface AcceptExistingResult {
  success: boolean;
  role: string;
  schoolId: string;
  classId?: string;
}

/** Payload for POST /invites/decline */
export interface DeclineInvitationPayload {
  token: string;
  reason?: string;
}

/** Response from POST /invites/decline */
export interface DeclineInvitationResponse {
  success: boolean;
  message: string;
  status: string;
}

/** Generic record for invitation lists */
export interface UserInvitationRecord {
  id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  sent: string;
  expires: string;
  token?: string;
}

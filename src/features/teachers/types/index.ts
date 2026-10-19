/**
 * Teachers Feature Types
 *
 * Aligned with backend DTOs and database schemas in lumio-api-v1-main,
 * and UI view models migrated from lumio-react.
 */

export type InviteStatus = 'Pending' | 'Accepted' | 'Declined' | 'Expired';

export type BackendInviteStatus = 'pending' | 'viewed' | 'accepted' | 'expired' | 'revoked';

export type InvitationAssignmentType = 'none' | 'form_teacher' | 'subject_teacher';

/** Backend DTO for POST /invites/teachers */
export interface InviteTeacherPayload {
  email: string;
  classId?: string;
  assignmentType?: 'none' | 'form_teacher' | 'subject_teacher';
}

/** Payload for POST /teachers/form-teacher */
export interface AssignFormTeacherPayload {
  classId: string;
  teacherId: string;
}

/** Payload for POST /teachers/assign-subjects */
export interface AssignTeacherSubjectPayload {
  teacherId: string;
  classId: string;
  subjectId: string;
}

/** Response from POST /invites/teachers */
export interface InviteTeacherResponse {
  id: string;
  email: string;
  role: string;
  classId?: string;
  status: string;
  token?: string;
}

/** Teacher subject record returned from backend */
export interface TeacherSubject {
  id: string;
  title: string;
  classId?: string;
}

/** Shape of teacher class assignment returned from backend */
export interface TeacherClassAssignment {
  id: string;
  grade?: string;
  section?: string;
  level?: string;
  department?: string;
  isFormTeacher?: boolean;
}

/** Shape of teacher record from GET /teachers */
export interface TeacherRecord {
  id: string;
  userId: string;
  membershipId?: string;
  teacherId?: string;
  schoolId?: string;
  classId?: string | null;
  role?: string;
  status: string;
  joinedAt: string;
  leftAt?: string | null;
  subjects: TeacherSubject[];
  // User profile fields (when available)
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  phone?: string | null;
  staffNo?: string;
  department?: string;
  rating?: number;
  classes?: Array<string | TeacherClassAssignment>;
  attendance?: number;
}

/** Frontend invitation representation */
export interface TeacherInvitation {
  id: string;
  name?: string;
  email: string;
  role?: string;
  classId?: string;
  className?: string;
  subjects?: string[];
  status: InviteStatus;
  sent: string;
  expires: string;
  acceptedOn?: string;
  token?: string;
  teacherId?: string;
}

/** Form values for the teacher invite modal */
export interface InviteTeacherFormValues {
  email: string;
  classId?: string;
  name?: string;
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
  subjectId?: string;
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

/** Payload for POST /invites/accept-existing */
export interface AcceptExistingPayload {
  token: string;
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

/** Response from POST /invites/accept-existing */
export interface AcceptExistingResult {
  success: boolean;
  role: string;
  schoolId: string;
  classId?: string;
}



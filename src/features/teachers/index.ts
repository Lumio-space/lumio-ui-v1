/**
 * Teachers Feature Module
 *
 * Public API for the teachers feature: components, hooks, constants, types, schemas.
 */

export { TeachersView } from './components/TeachersView';
export { InviteTeacherModal } from './components/InviteTeacherModal';
export { TeacherDetailModal } from './components/TeacherDetailModal';
export { FormTeacherBadge } from './components/FormTeacherBadge';
export { TeacherCard } from './components/TeacherCard';
export { TeacherRow } from './components/TeacherRow';
export { AcceptInviteView } from './components/AcceptInviteView';
export { AcceptInviteSkeleton } from './components/AcceptInviteSkeleton';
export { InviteDetailsView } from './components/InviteDetailsView';
export { InviteSetupView } from './components/InviteSetupView';
export { InviteLoginView } from './components/InviteLoginView';

export {
  useTeachers,
  useInviteTeacher,
  useRemoveTeacher,
  useUpdateTeacherStatus,
  useInvitations,
  useValidateInvitation,
  useAcceptNewTeacher,
  useAcceptExistingTeacher,
} from './hooks';

export {
  fetchTeachers,
  inviteTeacher,
  removeTeacher,
  updateTeacherStatus,
  validateInvitationToken,
  acceptNewUserInvitation,
  acceptExistingUserInvitation,
} from './api/teachers.api';

export * from './constants';
export * from './types';
export * from './schemas';


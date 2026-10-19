/**
 * Teachers API
 *
 * Endpoints (from teachers.controller.ts and invitations.controller.ts):
 *   GET    /teachers             → getTeachers (requires MANAGE_TEACHERS permission)
 *   DELETE /teachers/:teacherId  → removeTeacher (requires MANAGE_TEACHERS permission)
 *   POST   /invites/teachers     → inviteTeacher (requires INVITE_TEACHER permission)
 *
 * Authentication is handled by backend JWT + RBAC guards.
 * Shared apiClient normalizes errors through the response interceptor.
 */

import { apiClient } from '@/lib/api/axios';
import type {
  TeacherRecord,
  InviteTeacherPayload,
  InviteTeacherResponse,
  ValidateInvitationResponse,
  AcceptInvitationPayload,
  AcceptInvitationResult,
  AcceptExistingPayload,
  AcceptExistingResult,
  DeclineInvitationPayload,
  DeclineInvitationResponse,
} from '../types';

export function normalizeTeacherRecord(raw: any): TeacherRecord {
  if (!raw || typeof raw !== 'object') {
    return raw as TeacherRecord;
  }

  const user = raw.user || {};
  const fullName =
    raw.fullName ||
    raw.name ||
    user.fullName ||
    user.name ||
    (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}`.trim() : undefined) ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined);

  const email = raw.email || user.email;
  const phone = raw.phone ?? user.phone ?? null;
  const avatar = raw.avatar || user.avatar;
  const id = raw.membershipId || raw.id;
  const userId = raw.teacherId || raw.userId || id;

  return {
    ...raw,
    id,
    userId,
    teacherId: raw.teacherId || userId,
    membershipId: raw.membershipId || id,
    fullName,
    name: fullName,
    email,
    phone,
    avatar,
    classes: Array.isArray(raw.classes) ? raw.classes : [],
    subjects: Array.isArray(raw.subjects) ? raw.subjects : [],
  };
}

export async function fetchTeachers(): Promise<TeacherRecord[]> {
  const response = await apiClient.get<
    TeacherRecord[] | { data?: TeacherRecord[]; teachers?: TeacherRecord[]; items?: TeacherRecord[] }
  >('/teachers');
  const resData = response.data;
  let items: any[] = [];
  if (Array.isArray(resData)) {
    items = resData;
  } else if (resData && typeof resData === 'object') {
    if (Array.isArray(resData.data)) items = resData.data;
    else if (Array.isArray(resData.teachers)) items = resData.teachers;
    else if (Array.isArray(resData.items)) items = resData.items;
  }
  return items.map(normalizeTeacherRecord);
}

export async function inviteTeacher(
  payload: InviteTeacherPayload
): Promise<InviteTeacherResponse> {
  const response = await apiClient.post<InviteTeacherResponse>(
    '/invites/teachers',
    {
      email: payload.email,
      classId: payload.classId,
      assignmentType: payload.assignmentType ?? 'none',
    }
  );
  return response.data;
}

export async function setFormTeacher(
  classId: string,
  teacherId: string
): Promise<{ message: string; classId: string; teacherId: string }> {
  const response = await apiClient.post<{ message: string; classId: string; teacherId: string }>(
    '/teachers/form-teacher',
    { classId, teacherId }
  );
  return response.data;
}

export async function assignSubjectToTeacher(
  teacherId: string,
  classId: string,
  subjectId: string
): Promise<{ message: string; teacherId: string; classId: string; subjectId: string }> {
  const response = await apiClient.post<{ message: string; teacherId: string; classId: string; subjectId: string }>(
    '/teachers/assign-subjects',
    { teacherId, classId, subjectId }
  );
  return response.data;
}

export async function removeTeacher(
  teacherId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/teachers/${teacherId}`
  );
  return response.data;
}

export async function updateTeacherStatus(
  teacherId: string,
  status: 'active' | 'suspended' | 'left'
): Promise<{ id: string; status: string }> {
  const response = await apiClient.patch<{ id: string; status: string }>(
    `/teachers/${teacherId}/status`,
    { status }
  );
  return response.data;
}

import * as invitationsApi from '@/features/invitations/api/invitations.api';

export const validateInvitationToken = (token: string) =>
  invitationsApi.validateInvitationToken(token);

export const acceptNewUserInvitation = (payload: AcceptInvitationPayload) =>
  invitationsApi.acceptNewUserInvitation(payload);

export const acceptExistingUserInvitation = (payload: AcceptExistingPayload) =>
  invitationsApi.acceptExistingUserInvitation(payload);

export const declineInvitation = (payload: DeclineInvitationPayload) =>
  invitationsApi.declineInvitation(payload);

export const cancelInvitation = (invitationIdOrToken: string) =>
  invitationsApi.cancelInvitation(invitationIdOrToken);




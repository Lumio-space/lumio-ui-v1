/**
 * Invitations API
 *
 * Provides endpoints for parent, student, and teacher invitation creation and acceptance.
 * Interacts with backend InvitationsController at /invites.
 */

import { apiClient } from '@/lib/api/axios';
import type {
  InviteParentPayload,
  InviteParentResponse,
  InviteStudentPayload,
  InviteStudentResponse,
  ValidateInvitationResponse,
  AcceptInvitationPayload,
  AcceptInvitationResult,
  AcceptExistingPayload,
  AcceptExistingResult,
  DeclineInvitationPayload,
  DeclineInvitationResponse,
} from '../types';

/**
 * Invites a parent via POST /invites/parents
 * Requires INVITE_PARENT (or admin) permission.
 * Payload requires email only.
 */
export async function inviteParent(
  payload: InviteParentPayload
): Promise<InviteParentResponse> {
  const response = await apiClient.post<InviteParentResponse>(
    '/invites/parents',
    {
      email: payload.email.trim(),
    }
  );
  return response.data;
}

/**
 * Invites a student via POST /invites/students
 * Requires INVITE_STUDENT permission.
 * Form requires email only; classId is passed if context is provided.
 */
export async function inviteStudent(
  payload: InviteStudentPayload
): Promise<InviteStudentResponse> {
  const response = await apiClient.post<InviteStudentResponse>(
    '/invites/students',
    {
      email: payload.email.trim(),
      classId: payload.classId,
    }
  );
  return response.data;
}

/**
 * Validates an invitation token via GET /invites/accept?token=...
 * Public endpoint.
 */
export async function validateInvitationToken(
  token: string
): Promise<ValidateInvitationResponse> {
  const response = await apiClient.get<ValidateInvitationResponse>(
    `/invites/accept?token=${encodeURIComponent(token)}`
  );
  return response.data;
}

/**
 * Registers a new user and accepts an invitation via POST /invites/register
 * Public endpoint. Sets HTTP-only authentication cookies and returns session tokens.
 */
export async function acceptNewUserInvitation(
  payload: AcceptInvitationPayload
): Promise<AcceptInvitationResult> {
  const { token, fullName, phone, password, firstName, lastName } = payload;
  const computedFullName =
    fullName || `${firstName ?? ''} ${lastName ?? ''}`.trim();
  const body: { token: string; fullName: string; password: string; phone?: string } = {
    token,
    fullName: computedFullName,
    password,
  };
  if (phone && phone.trim()) {
    body.phone = phone.trim();
  }
  const response = await apiClient.post<AcceptInvitationResult>(
    '/invites/register',
    body
  );
  return response.data;
}

/**
 * Accepts an invitation for an existing authenticated user via POST /invites/accept-existing
 * Protected endpoint.
 */
export async function acceptExistingUserInvitation(
  payload: AcceptExistingPayload
): Promise<AcceptExistingResult> {
  const response = await apiClient.post<AcceptExistingResult>(
    '/invites/accept-existing',
    payload
  );
  return response.data;
}

/**
 * Declines an invitation token via POST /invites/decline
 * Public endpoint.
 */
export async function declineInvitation(
  payload: DeclineInvitationPayload
): Promise<DeclineInvitationResponse> {
  const response = await apiClient.post<DeclineInvitationResponse>(
    '/invites/decline',
    payload
  );
  return response.data;
}

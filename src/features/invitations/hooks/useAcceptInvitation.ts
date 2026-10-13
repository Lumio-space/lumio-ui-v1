'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { setAuthCookie, setSchoolCookie } from '@/features/auth/hooks/useAuth';
import { classQueryKeys } from '@/features/classes/constants';
import { teacherQueryKeys } from '@/features/teachers/constants';
import {
  validateInvitationToken,
  acceptNewUserInvitation,
  acceptExistingUserInvitation,
  declineInvitation,
} from '../api/invitations.api';
import type {
  AcceptInvitationPayload,
  AcceptExistingPayload,
  DeclineInvitationPayload,
} from '../types';

/**
 * Hook to validate an invitation token from the URL query params.
 */
export function useValidateInvitation(token: string | null) {
  return useQuery({
    queryKey: ['invitation', 'validate', token],
    queryFn: () => validateInvitationToken(token!),
    enabled: Boolean(token && token.trim().length > 0),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for an invited user (teacher, student, parent) to register and accept the invitation.
 * Establishes the role dynamically from backend response data.role.
 */
export function useAcceptNewUser() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) =>
      acceptNewUserInvitation(payload),
    onSuccess: (data, variables) => {
      const token = data.accessToken || (data as unknown as { token?: string }).token;
      if (token) {
        setAuthCookie(token, true);
        setAuthenticated(true);
      }

      const schoolId = data.schoolId;
      if (schoolId) {
        setSchoolCookie(schoolId, true);
      }

      const name =
        data.user.fullName ||
        variables.fullName ||
        (variables.firstName ? `${variables.firstName} ${variables.lastName}`.trim() : null) ||
        'User';

      // Establish the canonical role strictly from the backend response
      setUser({
        name,
        email: data.user.email,
        role: data.role,
        schoolId,
        classId: data.classId,
      });

      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });

      router.push('/dashboard');
    },
  });
}

/**
 * Hook for an existing authenticated user to accept the invitation.
 * Establishes the role dynamically from backend response data.role.
 */
export function useAcceptExistingUser() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: AcceptExistingPayload) =>
      acceptExistingUserInvitation(payload),
    onSuccess: (data) => {
      const currentUser = useAuthStore.getState().user;
      if (data.schoolId) {
        setSchoolCookie(data.schoolId, true);
      }

      setUser({
        id: currentUser?.id,
        name: currentUser?.name ?? 'User',
        email: currentUser?.email ?? '',
        schoolId: data.schoolId ?? currentUser?.schoolId,
        classId: data.classId ?? currentUser?.classId,
        role: data.role ?? currentUser?.role ?? 'admin',
      });

      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });

      router.push('/dashboard');
    },
  });
}

/**
 * Hook to decline an invitation.
 */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeclineInvitationPayload) =>
      declineInvitation(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['invitation', 'validate', variables.token] });
    },
  });
}

// Backward-compatible aliases for teacher imports
export const useAcceptNewTeacher = useAcceptNewUser;
export const useAcceptExistingTeacher = useAcceptExistingUser;

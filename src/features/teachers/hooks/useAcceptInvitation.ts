'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { setAuthCookie, setSchoolCookie } from '@/features/auth/hooks/useAuth';
import { classQueryKeys } from '@/features/classes/constants';
import { teacherQueryKeys } from '../constants';
import * as teachersApi from '../api/teachers.api';
import type {
  AcceptInvitationPayload,
  AcceptExistingPayload,
  DeclineInvitationPayload,
} from '../types';

import { useInvitationsStore } from '@/stores/invitations.store';

/**
 * Hook to validate an invitation token from the URL query params.
 */
export function useValidateInvitation(token: string | null) {
  return useQuery({
    queryKey: ['invitation', 'validate', token],
    queryFn: () => teachersApi.validateInvitationToken(token!),
    enabled: Boolean(token && token.trim().length > 0),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for a new teacher to register and accept the invitation.
 */
export function useAcceptNewTeacher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) =>
      teachersApi.acceptNewUserInvitation(payload),
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
        'Teacher';

      const teacherId = data.user.id;

      setUser({
        id: teacherId,
        name,
        email: data.user.email,
        role: data.role || 'TEACHER',
        schoolId,
        classId: data.classId,
      });

      // Synchronize invitation record
      useInvitationsStore.getState().markAccepted(data.user.email, {
        teacherId,
        name,
      });

      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });

      router.push('/dashboard');
    },
  });
}

/**
 * Hook for an existing authenticated teacher to accept the invitation.
 */
export function useAcceptExistingTeacher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: AcceptExistingPayload) =>
      teachersApi.acceptExistingUserInvitation(payload),
    onSuccess: (data) => {
      const currentUser = useAuthStore.getState().user;
      if (data.schoolId) {
        setSchoolCookie(data.schoolId, true);
      }

      setUser({
        id: currentUser?.id,
        name: currentUser?.name ?? 'Teacher',
        email: currentUser?.email ?? '',
        schoolId: data.schoolId ?? currentUser?.schoolId,
        classId: data.classId ?? currentUser?.classId,
        role: data.role ?? currentUser?.role ?? 'TEACHER',
      });

      // Synchronize invitation record
      if (currentUser?.email) {
        useInvitationsStore.getState().markAccepted(currentUser.email, {
          teacherId: currentUser.id,
          name: currentUser.name,
        });
      }

      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });

      router.push('/dashboard');
    },
  });
}

/**
 * Hook for a teacher to decline an invitation.
 */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeclineInvitationPayload) =>
      teachersApi.declineInvitation(payload),
    onSuccess: (_data, variables) => {
      useInvitationsStore.getState().markDeclined(variables.token);
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['invitation', 'validate', variables.token] });
    },
  });
}


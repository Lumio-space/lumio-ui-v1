'use client';

/**
 * Teachers Feature React Hooks
 *
 * Query and mutation hooks for teachers and teacher invitations.
 */

import { useSyncExternalStore, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classQueryKeys } from '@/features/classes/constants';
import { teacherQueryKeys } from '../constants';
import {
  fetchTeachers,
  inviteTeacher,
  setFormTeacher,
  assignSubjectToTeacher,
  removeTeacher,
  updateTeacherStatus,
} from '../api/teachers.api';
import type {
  InviteTeacherPayload,
  TeacherInvitation,
} from '../types';

/**
 * Query hook to fetch all teachers for the current school.
 */
export function useTeachers() {
  return useQuery({
    queryKey: teacherQueryKeys.lists(),
    queryFn: fetchTeachers,
  });
}

/**
 * Mutation hook to invite a teacher.
 * Invalidates teachers and classes lists on success.
 */
export function useInviteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteTeacherPayload) => inviteTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to assign a teacher as Form Teacher for a class.
 */
export function useAssignFormTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      setFormTeacher(classId, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to assign a subject to a teacher in a class.
 */
export function useAssignTeacherSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      classId,
      subjectId,
    }: {
      teacherId: string;
      classId: string;
      subjectId: string;
    }) => assignSubjectToTeacher(teacherId, classId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to remove a teacher from the school.
 */
export function useRemoveTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) => removeTeacher(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to update a teacher's status (active, suspended, left).
 */
export function useUpdateTeacherStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      status,
    }: {
      teacherId: string;
      status: 'active' | 'suspended' | 'left';
    }) => updateTeacherStatus(teacherId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

import { useInvitationsStore } from '@/stores/invitations.store';

/**
 * Hook to manage teacher invitations backed by persisted store with synchronization.
 */
export function useInvitations() {
  const invitations = useInvitationsStore((s) => s.invitations);
  const addInvitation = useInvitationsStore((s) => s.addInvitation);
  const resendInvitation = useInvitationsStore((s) => s.resendInvitation);
  const cancelInvitation = useInvitationsStore((s) => s.cancelInvitation);
  const markAccepted = useInvitationsStore((s) => s.markAccepted);
  const markDeclined = useInvitationsStore((s) => s.markDeclined);
  const syncWithBackend = useInvitationsStore((s) => s.syncWithBackend);
  const isInvitationCancelled = useInvitationsStore((s) => s.isInvitationCancelled);

  return {
    invitations,
    isLoaded: true,
    addInvitation,
    resendInvitation,
    revokeInvitation: cancelInvitation,
    cancelInvitation,
    isInvitationCancelled,
    markAccepted,
    markDeclined,
    syncWithBackend,
  };
}

export function markInvitationAcceptedByEmailOrToken(
  emailOrToken: string,
  details?: { teacherId?: string; name?: string }
) {
  useInvitationsStore.getState().markAccepted(emailOrToken, details);
}

export function markInvitationDeclinedByEmailOrToken(emailOrToken: string) {
  useInvitationsStore.getState().markDeclined(emailOrToken);
}

export * from './useAcceptInvitation';



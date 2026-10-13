/**
 * Subject Management Hooks (TanStack Query)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  assignClassesToSubject,
  assignTeacherToSubject,
} from '../api/subjects.api';
import { subjectQueryKeys } from '../constants';
import { classQueryKeys } from '@/features/classes/constants';
import type {
  CreateSubjectPayload,
  UpdateSubjectPayload,
} from '../types';

export function useSubjects() {
  return useQuery({
    queryKey: subjectQueryKeys.lists(),
    queryFn: fetchSubjects,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubjectPayload) => createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubjectPayload }) =>
      updateSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
    },
  });
}

export function useAssignClasses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, classIds }: { subjectId: string; classIds: string[] }) =>
      assignClassesToSubject(subjectId, classIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
    },
  });
}

export function useAssignTeacher() {
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
    }) => assignTeacherToSubject(teacherId, classId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { classQueryKeys }            from '../constants';
import { subjectQueryKeys }          from '@/features/subjects/constants';
import { fetchClasses, createClass, deleteClass } from '../api/classes.api';
import type { CreateClassPayload }   from '../types';

/**
 * Query hook — fetches the list of classes for the current school.
 * The school context is resolved server-side via @CurrentMembership.
 */
export function useClasses() {
  return useQuery({
    queryKey: classQueryKeys.lists(),
    queryFn:  fetchClasses,
    staleTime: 0,
  });
}

/**
 * Mutation hook — creates a new class.
 *
 * No onError handler here: the calling component owns the error display
 * (following the LoginForm / ForgotPasswordForm inline-error pattern).
 *
 * onSuccess invalidates classes and subjects queries so the new class
 * is immediately available across the application.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassPayload) => createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
    },
  });
}

/**
 * Mutation hook — deletes a class by ID.
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.all });
    },
  });
}


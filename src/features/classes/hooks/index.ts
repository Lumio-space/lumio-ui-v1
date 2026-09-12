'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { classQueryKeys }            from '../constants';
import { fetchClasses, createClass } from '../api/classes.api';
import type { CreateClassPayload }   from '../types';

/**
 * Query hook — fetches the list of classes for the current school.
 * The school context is resolved server-side via @CurrentMembership.
 */
export function useClasses() {
  return useQuery({
    queryKey: classQueryKeys.lists(),
    queryFn:  fetchClasses,
  });
}

/**
 * Mutation hook — creates a new class.
 *
 * No onError handler here: the calling component owns the error display
 * (following the LoginForm / ForgotPasswordForm inline-error pattern).
 *
 * onSuccess invalidates the classes list so the new class appears without
 * a manual reload.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassPayload) => createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.lists() });
    },
  });
}

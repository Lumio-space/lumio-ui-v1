'use client';

/**
 * Students Feature React Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentQueryKeys } from '../constants';
import {
  fetchStudents,
  fetchStudentById,
  removeStudent,
} from '../api/students.api';
import type { FetchStudentsParams } from '../types';

/**
 * Query hook to fetch students with optional filtering and pagination.
 */
export function useStudents(params?: FetchStudentsParams) {
  return useQuery({
    queryKey: studentQueryKeys.list(params as Record<string, unknown>),
    queryFn: () => fetchStudents(params),
  });
}

/**
 * Query hook to fetch a single student by ID.
 */
export function useStudent(studentId: string) {
  return useQuery({
    queryKey: studentQueryKeys.detail(studentId),
    queryFn: () => fetchStudentById(studentId),
    enabled: Boolean(studentId),
  });
}

/**
 * Mutation hook to remove a student.
 */
export function useRemoveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => removeStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.lists() });
    },
  });
}

'use client';

/**
 * Attendance React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClassAttendance,
  saveClassAttendance,
} from '../api/attendance.api';
import type { SaveAttendancePayload } from '../types';

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  byClass: (classId: string) => [...attendanceQueryKeys.all, 'class', classId] as const,
  byClassAndDate: (classId: string, date: string) =>
    [...attendanceQueryKeys.byClass(classId), date] as const,
};

export function useClassAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: attendanceQueryKeys.byClassAndDate(classId, date),
    queryFn: () => fetchClassAttendance(classId, date),
    enabled: Boolean(classId && date),
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAttendancePayload) => saveClassAttendance(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.byClassAndDate(
          variables.classId,
          variables.date
        ),
      });
    },
  });
}

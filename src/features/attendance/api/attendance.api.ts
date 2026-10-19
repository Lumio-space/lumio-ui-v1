/**
 * Attendance API Client
 *
 * Calls:
 *   GET  /attendance/:classId?date=YYYY-MM-DD
 *   POST /attendance/:classId
 */

import { apiClient } from '@/lib/api/axios';
import type {
  ClassAttendanceResponse,
  SaveAttendancePayload,
} from '../types';

export async function fetchClassAttendance(
  classId: string,
  date: string
): Promise<ClassAttendanceResponse> {
  const response = await apiClient.get<ClassAttendanceResponse>(
    `/attendance/${classId}`,
    {
      params: { date },
    }
  );
  return response.data;
}

export async function saveClassAttendance(
  payload: SaveAttendancePayload
): Promise<{ message: string; count: number }> {
  const response = await apiClient.post<{ message: string; count: number }>(
    `/attendance/${payload.classId}`,
    {
      date: payload.date,
      entries: payload.entries,
    }
  );
  return response.data;
}

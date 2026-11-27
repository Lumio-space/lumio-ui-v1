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
  UpdateAttendancePayload,
  StudentAttendanceRow,
  AttendanceStatus,
} from '../types';

export async function fetchClassAttendance(
  classId: string,
  date: string
): Promise<ClassAttendanceResponse> {
  const response = await apiClient.get<any>(
    `/attendance/${classId}`,
    {
      params: { date },
    }
  );
  const data = response.data;
  const rawStudents = Array.isArray(data?.students) ? data.students : [];
  const students: StudentAttendanceRow[] = rawStudents.map((s: any) => ({
    studentId: s.studentId || s.id,
    name: s.name || s.fullName || 'Student',
    avatar: s.avatar,
    rollNo: s.rollNo || s.rollNumber,
    status: s.status ? (String(s.status).toLowerCase() as AttendanceStatus) : null,
    remarks: s.remarks,
  }));

  const computedSummary = {
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
    excused: students.filter((s) => s.status === 'excused').length,
    total: students.length,
  };

  return {
    classId: data?.classId || classId,
    date: data?.date || date,
    summary: data?.summary
      ? {
          present: data.summary.present ?? computedSummary.present,
          absent: data.summary.absent ?? computedSummary.absent,
          late: data.summary.late ?? computedSummary.late,
          excused: data.summary.excused ?? computedSummary.excused,
          total: data.summary.total ?? data?.total ?? computedSummary.total,
        }
      : computedSummary,
    students,
  };
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

export async function updateClassAttendance(
  payload: UpdateAttendancePayload
): Promise<{ date: string; updated: number; unchanged: number }> {
  const response = await apiClient.patch<{ date: string; updated: number; unchanged: number }>(
    `/attendance/${payload.classId}`,
    {
      entries: payload.entries.map((e) => ({
        studentId: e.studentId,
        status: e.status,
      })),
    },
    {
      params: { date: payload.date },
    }
  );
  return response.data;
}

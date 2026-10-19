/**
 * Attendance Types
 *
 * Aligned with lumio-api-v1-main attendance service & endpoints:
 *   GET  /attendance/:classId?date=YYYY-MM-DD
 *   POST /attendance/:classId
 */

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceRow {
  studentId: string;
  name: string;
  avatar?: string;
  rollNo?: string;
  status: AttendanceStatus | null;
  remarks?: string | null;
}

export interface ClassAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  notMarked?: number;
  total?: number;
}

export interface ClassAttendanceResponse {
  classId: string;
  date: string;
  summary: ClassAttendanceSummary;
  students: StudentAttendanceRow[];
}

export interface AttendanceEntryItem {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SaveAttendancePayload {
  classId: string;
  date: string;
  entries: AttendanceEntryItem[];
}

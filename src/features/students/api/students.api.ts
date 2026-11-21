/**
 * Students API
 *
 * Interacts with backend student endpoints:
 *   GET    /students       → fetchStudents
 *   GET    /students/:id   → fetchStudentById
 *   DELETE /students/:id   → removeStudent
 */

import { apiClient } from '@/lib/api/axios';
import type {
  StudentRecord,
  StudentStatus,
  FetchStudentsParams,
  StudentsListResponse,
} from '../types';

export function normalizeStudentRecord(raw: any): StudentRecord {
  if (!raw || typeof raw !== 'object') {
    return raw as StudentRecord;
  }

  const user = raw.user || {};
  const cls = raw.class || raw.classRecord || {};

  const fullName =
    raw.fullName ||
    raw.name ||
    user.fullName ||
    user.name ||
    (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}`.trim() : undefined) ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined) ||
    'Student';

  const admissionNo =
    raw.admissionNo ||
    raw.admissionNumber ||
    raw.registrationNumber ||
    raw.regNo ||
    `ADM-${String(raw.id || '').slice(0, 6)}`;

  const email = raw.email || user.email || '';
  const phone = raw.phone || user.phone || '';
  const avatar = raw.avatar || user.avatar;

  const id = String(raw.id || raw.studentId || raw.membershipId || user.id || '');

  const grade = raw.grade || cls.grade || '';
  const section = raw.section || cls.section || '';
  const classId = raw.classId || cls.id || '';
  const className =
    raw.className ||
    (grade ? `${grade}${section ? ` · ${section}` : ''}` : '');

  let status: StudentStatus = 'Inactive';
  const rawStatus = String(raw.status || '').toLowerCase();
  if (rawStatus === 'active') {
    status = 'Active';
  } else if (rawStatus === 'graduated') {
    status = 'Graduated';
  } else if (raw.status === 'Active' || raw.status === 'Graduated') {
    status = raw.status;
  }

  const attendance =
    typeof raw.attendance === 'number'
      ? raw.attendance
      : typeof raw.attendanceRate === 'number'
      ? raw.attendanceRate
      : 0;

  const average =
    typeof raw.average === 'number'
      ? raw.average
      : typeof raw.averageScore === 'number'
      ? raw.averageScore
      : 0;

  const parent =
    raw.parent ||
    raw.parentName ||
    raw.guardianName ||
    raw.parentUser?.fullName ||
    raw.guardian?.name ||
    '—';

  const parentPhone =
    raw.parentPhone ||
    raw.guardianPhone ||
    raw.parentUser?.phone ||
    '—';

  return {
    id,
    userId: raw.userId || user.id,
    name: fullName,
    fullName,
    admissionNo,
    grade,
    section,
    classId,
    className,
    rollNo: Number(raw.rollNo ?? raw.rollNumber ?? 1),
    gender: raw.gender || '—',
    status,
    attendance,
    average,
    parent,
    parentPhone,
    parentEmail: raw.parentEmail || raw.guardianEmail,
    email,
    phone,
    avatar,
    joined: raw.joined || raw.createdAt || new Date().toISOString(),
  };
}

export async function fetchStudents(
  params?: FetchStudentsParams
): Promise<StudentsListResponse> {
  const response = await apiClient.get<
    | StudentRecord[]
    | {
        data?: StudentRecord[];
        students?: StudentRecord[];
        items?: StudentRecord[];
        total?: number;
        page?: number;
        limit?: number;
      }
  >('/students', { params });

  const resData = response.data;
  let items: any[] = [];
  let total = 0;

  if (Array.isArray(resData)) {
    items = resData;
    total = resData.length;
  } else if (resData && typeof resData === 'object') {
    if (Array.isArray(resData.data)) {
      items = resData.data;
    } else if (Array.isArray(resData.students)) {
      items = resData.students;
    } else if (Array.isArray(resData.items)) {
      items = resData.items;
    }
    total = resData.total ?? items.length;
  }

  return {
    data: items.map(normalizeStudentRecord),
    total,
    page: (resData as any)?.page,
    limit: (resData as any)?.limit,
  };
}

export async function fetchStudentById(studentId: string): Promise<StudentRecord> {
  const response = await apiClient.get<any>(`/students/${studentId}`);
  const record = response.data?.data || response.data?.student || response.data;
  return normalizeStudentRecord(record);
}

export async function removeStudent(studentId: string): Promise<void> {
  await apiClient.delete(`/students/${studentId}`);
}

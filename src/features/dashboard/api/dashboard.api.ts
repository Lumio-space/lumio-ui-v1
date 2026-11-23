/**
 * Admin Dashboard API Service
 *
 * Endpoints (from school-admin-dashboard.controller.ts):
 *   GET /school-admin/dashboard/overview
 *   GET /school-admin/dashboard/attendance-overview?from=...&to=...
 *   GET /school-admin/dashboard/enrollment-by-grade
 */

import { apiClient } from '@/lib/api/axios';

export interface AdminDashboardOverviewResponse {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  averageAttendance: number;
}

export interface AttendanceTrendItem {
  month: string; // YYYY-MM
  presentRate: number;
}

export interface EnrollmentByGradeItem {
  gradeLevel: string;
  count: number;
}

export async function fetchAdminDashboardOverview(): Promise<AdminDashboardOverviewResponse> {
  const response = await apiClient.get<AdminDashboardOverviewResponse>(
    '/school-admin/dashboard/overview'
  );
  return response.data;
}

export async function fetchAdminAttendanceOverview(
  from: string,
  to: string
): Promise<AttendanceTrendItem[]> {
  const response = await apiClient.get<AttendanceTrendItem[]>(
    '/school-admin/dashboard/attendance-overview',
    {
      params: { from, to },
    }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchAdminEnrollmentByGrade(): Promise<EnrollmentByGradeItem[]> {
  const response = await apiClient.get<EnrollmentByGradeItem[]>(
    '/school-admin/dashboard/enrollment-by-grade'
  );
  return Array.isArray(response.data) ? response.data : [];
}

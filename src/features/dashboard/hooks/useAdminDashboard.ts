'use client';

/**
 * Admin Dashboard Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminDashboardOverview,
  fetchAdminAttendanceOverview,
  fetchAdminEnrollmentByGrade,
} from '../api/dashboard.api';

export const adminDashboardQueryKeys = {
  all: ['school-admin-dashboard'] as const,
  overview: () => [...adminDashboardQueryKeys.all, 'overview'] as const,
  attendanceOverview: (from: string, to: string) =>
    [...adminDashboardQueryKeys.all, 'attendance-overview', from, to] as const,
  enrollmentByGrade: () =>
    [...adminDashboardQueryKeys.all, 'enrollment-by-grade'] as const,
};

export function useAdminDashboardOverview() {
  return useQuery({
    queryKey: adminDashboardQueryKeys.overview(),
    queryFn: fetchAdminDashboardOverview,
  });
}

export function useAdminAttendanceOverview(from: string, to: string) {
  return useQuery({
    queryKey: adminDashboardQueryKeys.attendanceOverview(from, to),
    queryFn: () => fetchAdminAttendanceOverview(from, to),
    enabled: Boolean(from && to),
  });
}

export function useAdminEnrollmentByGrade() {
  return useQuery({
    queryKey: adminDashboardQueryKeys.enrollmentByGrade(),
    queryFn: fetchAdminEnrollmentByGrade,
  });
}

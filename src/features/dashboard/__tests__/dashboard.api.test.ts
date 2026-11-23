import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminDashboardOverview,
  fetchAdminAttendanceOverview,
  fetchAdminEnrollmentByGrade,
} from '../api/dashboard.api';
import { apiClient } from '@/lib/api/axios';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboard.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchAdminDashboardOverview calls GET /school-admin/dashboard/overview', async () => {
    const mockData = {
      totalTeachers: 10,
      totalStudents: 100,
      totalClasses: 5,
      averageAttendance: 95,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const res = await fetchAdminDashboardOverview();
    expect(apiClient.get).toHaveBeenCalledWith('/school-admin/dashboard/overview');
    expect(res).toEqual(mockData);
  });

  it('fetchAdminAttendanceOverview calls GET /school-admin/dashboard/attendance-overview with from and to params', async () => {
    const mockData = [{ month: '2026-01', presentRate: 90 }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const res = await fetchAdminAttendanceOverview('2026-01-01', '2026-06-30');
    expect(apiClient.get).toHaveBeenCalledWith('/school-admin/dashboard/attendance-overview', {
      params: { from: '2026-01-01', to: '2026-06-30' },
    });
    expect(res).toEqual(mockData);
  });

  it('fetchAdminEnrollmentByGrade calls GET /school-admin/dashboard/enrollment-by-grade', async () => {
    const mockData = [{ gradeLevel: 'JSS1', count: 45 }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const res = await fetchAdminEnrollmentByGrade();
    expect(apiClient.get).toHaveBeenCalledWith('/school-admin/dashboard/enrollment-by-grade');
    expect(res).toEqual(mockData);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchClassAttendance,
  saveClassAttendance,
  updateClassAttendance,
} from '../api/attendance.api';
import { apiClient } from '@/lib/api/axios';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('attendance.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchClassAttendance calls GET /attendance/:classId with date param', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { classId: 'cls-1', date: '2026-06-28', students: [], summary: {} },
    });

    const res = await fetchClassAttendance('cls-1', '2026-06-28');
    expect(apiClient.get).toHaveBeenCalledWith('/attendance/cls-1', {
      params: { date: '2026-06-28' },
    });
    expect(res.classId).toBe('cls-1');
  });

  it('saveClassAttendance calls POST /attendance/:classId with payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { message: 'Recorded', count: 2 },
    });

    const res = await saveClassAttendance({
      classId: 'cls-1',
      date: '2026-06-28',
      entries: [{ studentId: 's-1', status: 'present' }],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/attendance/cls-1', {
      date: '2026-06-28',
      entries: [{ studentId: 's-1', status: 'present' }],
    });
    expect(res.count).toBe(2);
  });

  it('updateClassAttendance calls PATCH /attendance/:classId?date=... with entries', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: { date: '2026-06-28', updated: 1, unchanged: 0 },
    });

    const res = await updateClassAttendance({
      classId: 'cls-1',
      date: '2026-06-28',
      entries: [{ studentId: 's-1', status: 'absent' }],
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/attendance/cls-1',
      {
        entries: [{ studentId: 's-1', status: 'absent' }],
      },
      {
        params: { date: '2026-06-28' },
      }
    );
    expect(res.updated).toBe(1);
  });
});

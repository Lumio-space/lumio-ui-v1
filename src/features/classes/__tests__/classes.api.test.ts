import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { fetchClasses } from '../api/classes.api';
import { useDeleteClass } from '../hooks';
import { classQueryKeys } from '../constants';
import { subjectQueryKeys } from '@/features/subjects/constants';
import { teacherQueryKeys } from '@/features/teachers/constants';
import { adminDashboardQueryKeys } from '@/features/dashboard/hooks/useAdminDashboard';
import { apiClient } from '@/lib/api/axios';
import type { ClassRecord } from '../types';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const ACTIVE_CLASS: ClassRecord = {
  id: 'cls-active-1',
  schoolId: 'sch-1',
  grade: 'JSS1',
  section: 'A',
  level: 'junior_secondary',
  capacity: 35,
  room: 101,
  department: 'Nill',
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

const DELETED_CLASS: ClassRecord = {
  id: 'cls-deleted-1',
  schoolId: 'sch-1',
  grade: 'JSS1',
  section: 'B',
  level: 'junior_secondary',
  capacity: 35,
  room: 102,
  department: 'Nill',
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: '2026-02-01T12:00:00.000Z',
};

describe('classes.api & useDeleteClass (Issue 8 & Issue 6B regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps active classes and excludes soft-deleted classes in mixed responses', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: [ACTIVE_CLASS, DELETED_CLASS] },
    });

    const result = await fetchClasses();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cls-active-1');
  });

  it('returns empty array when all returned classes are soft-deleted or empty', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [DELETED_CLASS],
    });
    expect(await fetchClasses()).toEqual([]);

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: [] },
    });
    expect(await fetchClasses()).toEqual([]);
  });

  it('surfaces 403 Forbidden and 404 errors instead of swallowing them as empty arrays', async () => {
    const forbiddenErr = Object.assign(new Error('Insufficient permissions'), {
      status: 403,
      response: { status: 403 },
    });
    vi.mocked(apiClient.get).mockRejectedValueOnce(forbiddenErr);
    await expect(fetchClasses()).rejects.toThrow('Insufficient permissions');

    const notFoundErr = Object.assign(new Error('Not found'), {
      status: 404,
      response: { status: 404 },
    });
    vi.mocked(apiClient.get).mockRejectedValueOnce(notFoundErr);
    await expect(fetchClasses()).rejects.toThrow('Not found');
  });

  it('useDeleteClass invalidates classes, subjects, teachers, and admin dashboard query keys', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteClass(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('cls-active-1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/classes/cls-active-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: classQueryKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: subjectQueryKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teacherQueryKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminDashboardQueryKeys.all });
  });
});

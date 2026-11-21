import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/axios';
import {
  normalizeParentRecord,
  fetchParents,
  fetchParentById,
} from '../api/parents.api';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('parents.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeParentRecord', () => {
    it('normalizes flat record correctly with linked children', () => {
      const raw = {
        membershipId: 'mem-100',
        parentId: 'parent-100',
        fullName: 'Robert Bennett',
        email: 'robert@example.com',
        phone: '+15550142',
        status: 'Active',
        children: [
          {
            studentId: 's-1',
            studentName: 'Amelia Bennett',
            grade: 'Grade 10',
            section: 'A',
            relationship: 'Father',
          },
        ],
      };

      const result = normalizeParentRecord(raw);
      expect(result.id).toBe('mem-100');
      expect(result.name).toBe('Robert Bennett');
      expect(result.email).toBe('robert@example.com');
      expect(result.phone).toBe('+15550142');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].studentName).toBe('Amelia Bennett');
      expect(result.children[0].className).toBe('Grade 10 · A');
    });

    it('normalizes nested user data and missing children safely', () => {
      const raw = {
        user: {
          id: 'u-1',
          firstName: 'Sandra',
          lastName: 'Carter',
          email: 'sandra@example.com',
        },
      };

      const result = normalizeParentRecord(raw);
      expect(result.id).toBe('u-1');
      expect(result.name).toBe('Sandra Carter');
      expect(result.email).toBe('sandra@example.com');
      expect(result.children).toEqual([]);
      expect(result.status).toBe('Active');
    });
  });

  describe('fetchParents', () => {
    it('handles direct array response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [{ id: 'p-1', name: 'John Doe', children: [] }],
      });

      const res = await fetchParents();
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.data[0].name).toBe('John Doe');
    });

    it('handles wrapped data object response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [{ id: 'p-2', name: 'Jane Smith', children: [] }],
          total: 1,
        },
      });

      const res = await fetchParents({ search: 'Jane' });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/parents', {
        params: { search: 'Jane' },
      });
    });
  });

  describe('fetchParentById', () => {
    it('fetches single parent and normalizes', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { id: 'p-10', name: 'Mary Watson', children: [] },
      });

      const res = await fetchParentById('p-10');
      expect(res.id).toBe('p-10');
      expect(res.name).toBe('Mary Watson');
      expect(apiClient.get).toHaveBeenCalledWith('/parents/p-10');
    });
  });
});

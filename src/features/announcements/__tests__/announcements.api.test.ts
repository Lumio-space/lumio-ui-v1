import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAnnouncements,
  fetchAnnouncementById,
  createAnnouncement,
} from '../api/announcements.api';
import { apiClient } from '@/lib/api/axios';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('announcements.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAnnouncements', () => {
    it('fetches paginated announcements with page and limit params and normalizes meta', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'ann-1',
              title: 'Term Resumption',
              message: 'School resumes Monday.',
              audiences: ['teacher', 'parent'],
              createdAt: '2026-09-01T08:00:00.000Z',
            },
          ],
          meta: {
            total: 15,
            page: 2,
            limit: 10,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        },
      });

      const res = await fetchAnnouncements({ page: 2, limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/announcements', {
        params: { page: 2, limit: 10 },
      });
      expect(res.data).toHaveLength(1);
      expect(res.data[0]).toEqual({
        id: 'ann-1',
        title: 'Term Resumption',
        message: 'School resumes Monday.',
        audiences: ['teacher', 'parent'],
        createdAt: '2026-09-01T08:00:00.000Z',
      });
      expect(res.meta).toEqual({
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('propagates API errors instead of swallowing them', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('syntax error at or near "ANY"')
      );

      await expect(fetchAnnouncements({ page: 1, limit: 10 })).rejects.toThrow(
        'syntax error at or near "ANY"'
      );
    });
  });

  describe('fetchAnnouncementById', () => {
    it('calls GET /announcements/:id and returns the normalized record', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'ann-42',
          title: 'PTA Notice',
          message: 'Meeting at 10 AM.',
          audiences: ['parent'],
          createdAt: '2026-09-02T09:00:00.000Z',
        },
      });

      const record = await fetchAnnouncementById('ann-42');

      expect(apiClient.get).toHaveBeenCalledWith('/announcements/ann-42');
      expect(record.id).toBe('ann-42');
      expect(record.audiences).toEqual(['parent']);
    });
  });

  describe('createAnnouncement', () => {
    it('trims title/message, deduplicates audiences, and calls POST /announcements', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          id: 'ann-99',
          title: 'Exam Timetable',
          message: 'Starts next week.',
          audiences: ['teacher', 'student'],
          createdAt: '2026-09-03T10:00:00.000Z',
        },
      });

      const created = await createAnnouncement({
        title: '  Exam Timetable  ',
        message: '  Starts next week.  ',
        audiences: ['teacher', 'student', 'teacher'],
      });

      expect(apiClient.post).toHaveBeenCalledWith('/announcements', {
        title: 'Exam Timetable',
        message: 'Starts next week.',
        audiences: ['teacher', 'student'],
      });
      expect(created.id).toBe('ann-99');
    });
  });
});

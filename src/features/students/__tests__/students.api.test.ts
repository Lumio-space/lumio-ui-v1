import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/axios';
import {
  normalizeStudentRecord,
  fetchStudents,
  fetchStudentById,
  removeStudent,
} from '../api/students.api';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('students.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeStudentRecord', () => {
    it('normalizes flat record correctly', () => {
      const raw = {
        id: 'std-1',
        name: 'Jane Doe',
        admissionNo: 'ADM-1001',
        grade: 'Grade 10',
        section: 'A',
        status: 'Active',
        attendance: 95,
        average: 88,
        parent: 'John Doe',
        parentPhone: '+1234567890',
        email: 'jane@lumio.edu',
      };

      const result = normalizeStudentRecord(raw);
      expect(result.id).toBe('std-1');
      expect(result.name).toBe('Jane Doe');
      expect(result.fullName).toBe('Jane Doe');
      expect(result.admissionNo).toBe('ADM-1001');
      expect(result.grade).toBe('Grade 10');
      expect(result.section).toBe('A');
      expect(result.status).toBe('Active');
      expect(result.attendance).toBe(95);
      expect(result.average).toBe(88);
      expect(result.parent).toBe('John Doe');
      expect(result.parentPhone).toBe('+1234567890');
    });

    it('normalizes nested user and class objects', () => {
      const raw = {
        id: 'std-2',
        user: {
          id: 'user-2',
          firstName: 'Amelia',
          lastName: 'Bennett',
          email: 'amelia@lumio.edu',
          phone: '+1555000',
        },
        class: {
          id: 'cls-10',
          grade: 'SSS 1',
          section: 'B',
        },
        status: 'active',
        attendanceRate: 92,
        averageScore: 84,
        parentUser: {
          fullName: 'Robert Bennett',
          phone: '+1555111',
        },
      };

      const result = normalizeStudentRecord(raw);
      expect(result.id).toBe('std-2');
      expect(result.name).toBe('Amelia Bennett');
      expect(result.grade).toBe('SSS 1');
      expect(result.section).toBe('B');
      expect(result.className).toBe('SSS 1 · B');
      expect(result.status).toBe('Active');
      expect(result.attendance).toBe(92);
      expect(result.average).toBe(84);
      expect(result.parent).toBe('Robert Bennett');
      expect(result.parentPhone).toBe('+1555111');
      expect(result.email).toBe('amelia@lumio.edu');
    });

    it('defaults missing or inactive fields gracefully', () => {
      const result = normalizeStudentRecord({});
      expect(result.name).toBe('Student');
      expect(result.status).toBe('Inactive');
      expect(result.attendance).toBe(0);
      expect(result.average).toBe(0);
      expect(result.parent).toBe('—');
      expect(result.parentPhone).toBe('—');
    });
  });

  describe('fetchStudents', () => {
    it('handles direct array response', async () => {
      const mockRaw = [
        { id: '1', name: 'Alice', status: 'Active' },
        { id: '2', name: 'Bob', status: 'Inactive' },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRaw });

      const res = await fetchStudents();
      expect(res.data).toHaveLength(2);
      expect(res.total).toBe(2);
      expect(res.data[0].name).toBe('Alice');
    });

    it('handles wrapped data object response', async () => {
      const mockRaw = {
        data: [{ id: '1', name: 'Alice', status: 'Active' }],
        total: 1,
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRaw });

      const res = await fetchStudents({ page: 1, limit: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/students', {
        params: { page: 1, limit: 10 },
      });
    });
  });

  describe('fetchStudentById', () => {
    it('fetches single student and normalizes', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { id: 's-1', name: 'Charlie', status: 'Active' },
      });

      const res = await fetchStudentById('s-1');
      expect(res.id).toBe('s-1');
      expect(res.name).toBe('Charlie');
      expect(apiClient.get).toHaveBeenCalledWith('/students/s-1');
    });
  });

  describe('removeStudent', () => {
    it('calls DELETE /students/:id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });

      await removeStudent('s-123');
      expect(apiClient.delete).toHaveBeenCalledWith('/students/s-123');
    });
  });
});

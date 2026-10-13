// @vitest-environment jsdom
/**
 * subjects.api — unit tests
 *
 * Verifies:
 * - normalizeSubject properly maps backend enum to SchoolSection
 * - normalizeSubject does not force Nursery/Primary/JSS to Senior Secondary
 * - normalizeSubject attaches department and type only when section is Senior Secondary
 * - createSubject preserves payload section, department, type and attached classes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeSubject,
  createSubject,
  saveSubjectMetadata,
  getStoredMetadata,
  assignClassesToSubject,
  BACKEND_TO_SECTION_MAP,
} from '../api/subjects.api';
import { apiClient } from '@/lib/api/axios';

const storageMock: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMock[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    storageMock[key] = val;
  }),
  clear: vi.fn(() => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  }),
  removeItem: vi.fn((key: string) => {
    delete storageMock[key];
  }),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('subjects.api', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('BACKEND_TO_SECTION_MAP', () => {
    it('maps lowercase backend enums to title-cased SchoolSection', () => {
      expect(BACKEND_TO_SECTION_MAP['nursery']).toBe('Nursery');
      expect(BACKEND_TO_SECTION_MAP['primary']).toBe('Primary');
      expect(BACKEND_TO_SECTION_MAP['junior_secondary']).toBe('Junior Secondary');
      expect(BACKEND_TO_SECTION_MAP['senior_secondary']).toBe('Senior Secondary');
    });
  });

  describe('normalizeSubject', () => {
    it('preserves Nursery section and does not add department/type', () => {
      const item = {
        id: 'sub-1',
        title: 'Number Work',
        code: 'NUM',
        section: 'nursery',
      };

      const normalized = normalizeSubject(item);
      expect(normalized.section).toBe('Nursery');
      expect(normalized.department).toBeUndefined();
      expect(normalized.type).toBeUndefined();
    });

    it('preserves Primary section and does not add department/type', () => {
      const item = {
        id: 'sub-2',
        title: 'Basic Science',
        code: 'BSC',
        section: 'primary',
      };

      const normalized = normalizeSubject(item);
      expect(normalized.section).toBe('Primary');
      expect(normalized.department).toBeUndefined();
      expect(normalized.type).toBeUndefined();
    });

    it('preserves Junior Secondary section and does not add department/type', () => {
      const item = {
        id: 'sub-3',
        title: 'Basic Technology',
        code: 'BTC',
        section: 'junior_secondary',
      };

      const normalized = normalizeSubject(item);
      expect(normalized.section).toBe('Junior Secondary');
      expect(normalized.department).toBeUndefined();
      expect(normalized.type).toBeUndefined();
    });

    it('maps Senior Secondary section and retains department and subject type', () => {
      const item = {
        id: 'sub-4',
        title: 'Physics',
        code: 'PHY',
        section: 'senior_secondary',
        department: 'Science',
        subjectType: 'compulsory',
      };

      const normalized = normalizeSubject(item);
      expect(normalized.section).toBe('Senior Secondary');
      expect(normalized.department).toBe('Science');
      expect(normalized.type).toBe('Compulsory');
    });

    it('uses stored metadata if backend returns sparse record without section', () => {
      saveSubjectMetadata('sub-5', {
        section: 'Primary',
        status: 'Active',
      });

      const sparseItem = {
        id: 'sub-5',
        title: 'English Language',
        code: 'ENG',
      };

      const normalized = normalizeSubject(sparseItem);
      expect(normalized.section).toBe('Primary');
      expect(normalized.department).toBeUndefined();
    });
  });

  describe('createSubject', () => {
    it('creates Nursery subject, sends schoolLevel to backend, and returns Nursery record', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          subject: {
            id: 'sub-n-100',
            schoolId: 'sch-1',
            title: 'Rhymes',
            code: 'RHY',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          attachedClasses: ['cls-nur-1', 'cls-nur-2'],
        },
      });

      const result = await createSubject({
        name: 'Rhymes',
        code: 'RHY',
        section: 'Nursery',
        status: 'Active',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        name: 'Rhymes',
        code: 'RHY',
        section: 'nursery',
        schoolLevel: 'nursery',
        subjectType: 'compulsory',
      }));

      expect(result.section).toBe('Nursery');
      expect(result.department).toBeUndefined();
      expect(result.type).toBeUndefined();
      // Requirement: creating a subject must not automatically assign it to classes
      expect(result.classIds).toEqual([]);

      // Stored metadata should also have Nursery and empty classIds
      const stored = getStoredMetadata()['sub-n-100'];
      expect(stored?.section).toBe('Nursery');
      expect(stored?.classIds).toEqual([]);
    });

    it('creates Senior Secondary subject, retains department and type without auto-attaching classes', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          subject: {
            id: 'sub-s-200',
            schoolId: 'sch-1',
            title: 'Chemistry',
            code: 'CHM',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          attachedClasses: ['cls-sss-1'],
        },
      });

      const result = await createSubject({
        name: 'Chemistry',
        code: 'CHM',
        section: 'Senior Secondary',
        department: 'Science',
        type: 'Compulsory',
        status: 'Active',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        name: 'Chemistry',
        code: 'CHM',
        section: 'senior_secondary',
        schoolLevel: 'senior_secondary',
        department: 'Science',
        subjectType: 'compulsory',
      }));

      expect(result.section).toBe('Senior Secondary');
      expect(result.department).toBe('Science');
      expect(result.type).toBe('Compulsory');
      // Requirement: creating a subject must not automatically assign it to classes
      expect(result.classIds).toEqual([]);

      // Stored metadata should also preserve department and type
      const stored = getStoredMetadata()['sub-s-200'];
      expect(stored?.section).toBe('Senior Secondary');
      expect(stored?.department).toBe('Science');
      expect(stored?.type).toBe('Compulsory');
      expect(stored?.classIds).toEqual([]);
    });
  });

  describe('assignClassesToSubject', () => {
    it('successfully calls POST /subjects/:id/classes and saves metadata on success', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true, classIds: ['cls-1', 'cls-2'] },
      });

      const res = await assignClassesToSubject('sub-1', ['cls-1', 'cls-2']);
      expect(res.success).toBe(true);
      expect(res.classIds).toEqual(['cls-1', 'cls-2']);
      expect(getStoredMetadata()['sub-1']?.classIds).toEqual(['cls-1', 'cls-2']);
    });

    it('gracefully falls back and persists class assignments when backend returns 404', async () => {
      // Simulates the normalized Error returned by interceptor when route does not exist
      const notFoundError = new Error('Cannot POST /subjects/sub-1/classes');
      (notFoundError as Error & { status?: number }).status = 404;
      vi.mocked(apiClient.post).mockRejectedValueOnce(notFoundError);

      const res = await assignClassesToSubject('sub-1', ['cls-10', 'cls-20']);
      expect(res.success).toBe(true);
      expect(res.classIds).toEqual(['cls-10', 'cls-20']);
      expect(getStoredMetadata()['sub-1']?.classIds).toEqual(['cls-10', 'cls-20']);
    });
  });
});

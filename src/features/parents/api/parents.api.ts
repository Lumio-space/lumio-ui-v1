/**
 * Parents API
 *
 * Interacts with backend parent directory endpoints:
 *   GET /parents       → fetchParents
 *   GET /parents/:id   → fetchParentById
 */

import { apiClient } from '@/lib/api/axios';
import type {
  ParentRecord,
  ParentChildRecord,
  FetchParentsParams,
  ParentsListResponse,
} from '../types';

export function normalizeParentRecord(raw: any): ParentRecord {
  if (!raw || typeof raw !== 'object') {
    return raw as ParentRecord;
  }

  const user = raw.user || {};
  const fullName =
    raw.fullName ||
    raw.name ||
    user.fullName ||
    user.name ||
    (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}`.trim() : undefined) ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined) ||
    'Parent';

  const email = raw.email || user.email || '';
  const phone = raw.phone ?? user.phone ?? null;
  const avatar = raw.avatar || user.avatar;
  const id = String(raw.membershipId || raw.parentId || raw.id || user.id || '');

  const rawChildren = Array.isArray(raw.children) ? raw.children : [];
  const children: ParentChildRecord[] = rawChildren.map((c: any) => {
    const studentName =
      c.studentName ||
      c.name ||
      c.fullName ||
      (c.firstName && c.lastName ? `${c.firstName} ${c.lastName}`.trim() : 'Student');

    const grade = c.grade || c.class?.grade || null;
    const section = c.section || c.class?.section || null;
    const className =
      c.className || (grade ? `${grade}${section ? ` · ${section}` : ''}` : undefined);

    return {
      studentId: String(c.studentId || c.id || ''),
      studentUserId: c.studentUserId ? String(c.studentUserId) : undefined,
      studentName,
      studentStatus: c.studentStatus || c.status || 'Active',
      classId: c.classId || c.class?.id || null,
      grade,
      section,
      className,
      relationship: c.relationship || 'Guardian',
      isPrimary: Boolean(c.isPrimary),
      avatar: c.avatar,
    };
  });

  return {
    id,
    parentId: raw.parentId || id,
    membershipId: raw.membershipId || id,
    userId: raw.userId || user.id,
    name: fullName,
    fullName,
    email,
    phone,
    status: raw.status || 'Active',
    joinedAt: raw.joinedAt || raw.createdAt || new Date().toISOString(),
    avatar,
    children,
  };
}

export async function fetchParents(
  params?: FetchParentsParams
): Promise<ParentsListResponse> {
  const response = await apiClient.get<
    | ParentRecord[]
    | {
        data?: ParentRecord[];
        parents?: ParentRecord[];
        items?: ParentRecord[];
        total?: number;
        page?: number;
        limit?: number;
      }
  >('/parents', { params });

  const resData = response.data;
  let items: any[] = [];
  let total = 0;

  if (Array.isArray(resData)) {
    items = resData;
    total = resData.length;
  } else if (resData && typeof resData === 'object') {
    if (Array.isArray(resData.data)) {
      items = resData.data;
    } else if (Array.isArray(resData.parents)) {
      items = resData.parents;
    } else if (Array.isArray(resData.items)) {
      items = resData.items;
    }
    total = resData.total ?? items.length;
  }

  return {
    data: items.map(normalizeParentRecord),
    total,
    page: (resData as any)?.page,
    limit: (resData as any)?.limit,
  };
}

export async function fetchParentById(parentId: string): Promise<ParentRecord> {
  const response = await apiClient.get<any>(`/parents/${parentId}`);
  const record = response.data?.data || response.data?.parent || response.data;
  return normalizeParentRecord(record);
}

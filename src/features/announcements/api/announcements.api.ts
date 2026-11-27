/**
 * Announcements API Service
 *
 * Backend contracts (announcements.controller.ts):
 *   GET  /announcements?page=1&limit=10 → findAll   (requires ANNOUNCEMENT_READ)
 *   GET  /announcements/:id             → findOne   (requires ANNOUNCEMENT_READ)
 *   POST /announcements                 → create    (requires ANNOUNCEMENT_CREATE)
 */

import { apiClient } from '@/lib/api/axios';
import type {
  AnnouncementAudience,
  AnnouncementRecord,
  AnnouncementsListResponse,
  CreateAnnouncementPayload,
} from '../types';

interface RawAnnouncementsResponse {
  data?: AnnouncementRecord[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const VALID_AUDIENCES = new Set<AnnouncementAudience>(['teacher', 'student', 'parent']);

function normalizeAnnouncement(raw: AnnouncementRecord): AnnouncementRecord {
  const audiences = Array.isArray(raw.audiences)
    ? raw.audiences.filter((a): a is AnnouncementAudience => VALID_AUDIENCES.has(a))
    : [];

  return {
    id: String(raw.id),
    title: raw.title ?? '',
    message: raw.message ?? '',
    audiences,
    createdAt: raw.createdAt ?? '',
  };
}

export async function fetchAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<AnnouncementsListResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const response = await apiClient.get<RawAnnouncementsResponse | AnnouncementRecord[]>(
    '/announcements',
    { params: { page, limit } }
  );

  const raw = response.data;
  if (Array.isArray(raw)) {
    const items = raw.map(normalizeAnnouncement);
    return {
      data: items,
      meta: {
        total: items.length,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const items = Array.isArray(raw?.data) ? raw.data.map(normalizeAnnouncement) : [];
  const metaSource = raw?.meta ?? raw;
  const total = Number(metaSource?.total ?? items.length);
  const currentPage = Number(metaSource?.page ?? page);
  const currentLimit = Number(metaSource?.limit ?? limit);
  const totalPages = Number(
    metaSource?.totalPages ?? (Math.ceil(total / Math.max(currentLimit, 1)) || 1)
  );

  return {
    data: items,
    meta: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
      hasNextPage:
        typeof raw?.meta?.hasNextPage === 'boolean'
          ? raw.meta.hasNextPage
          : currentPage < totalPages,
      hasPreviousPage:
        typeof raw?.meta?.hasPreviousPage === 'boolean'
          ? raw.meta.hasPreviousPage
          : currentPage > 1,
    },
  };
}

export async function fetchAnnouncementById(id: string): Promise<AnnouncementRecord> {
  const response = await apiClient.get<AnnouncementRecord>(`/announcements/${id}`);
  return normalizeAnnouncement(response.data);
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<AnnouncementRecord> {
  const uniqueAudiences = Array.from(new Set(payload.audiences));

  const response = await apiClient.post<AnnouncementRecord>('/announcements', {
    title: payload.title.trim(),
    message: payload.message.trim(),
    audiences: uniqueAudiences,
  });

  return normalizeAnnouncement(response.data);
}

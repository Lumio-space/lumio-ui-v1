export type AnnouncementAudience = 'teacher' | 'student' | 'parent';

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  audiences: AnnouncementAudience[];
  createdAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  audiences: AnnouncementAudience[];
}

export interface AnnouncementsListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AnnouncementsListResponse {
  data: AnnouncementRecord[];
  meta: AnnouncementsListMeta;
}

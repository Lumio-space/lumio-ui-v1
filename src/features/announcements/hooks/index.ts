'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnnouncements,
  fetchAnnouncementById,
  createAnnouncement,
} from '../api/announcements.api';
import { announcementQueryKeys, ANNOUNCEMENTS_DEFAULT_LIMIT } from '../constants';
import type { CreateAnnouncementPayload } from '../types';

export function useAnnouncements(
  page = 1,
  limit = ANNOUNCEMENTS_DEFAULT_LIMIT
) {
  return useQuery({
    queryKey: announcementQueryKeys.list(page, limit),
    queryFn: () => fetchAnnouncements({ page, limit }),
  });
}

export function useAnnouncementDetail(id: string | null) {
  return useQuery({
    queryKey: announcementQueryKeys.detail(id ?? ''),
    queryFn: () => fetchAnnouncementById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
    },
  });
}

import type { AnnouncementAudience } from '../types';

export const ANNOUNCEMENT_AUDIENCES: ReadonlyArray<{
  value: AnnouncementAudience;
  label: string;
  description: string;
}> = [
  {
    value: 'teacher',
    label: 'Teachers',
    description: 'Visible to teaching staff in your school',
  },
  {
    value: 'student',
    label: 'Students',
    description: 'Visible to enrolled students',
  },
  {
    value: 'parent',
    label: 'Parents',
    description: 'Visible to linked parents and guardians',
  },
] as const;

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  teacher: 'Teachers',
  student: 'Students',
  parent: 'Parents',
};

export const AUDIENCE_TONES: Record<
  AnnouncementAudience,
  'purple' | 'indigo' | 'green'
> = {
  teacher: 'purple',
  student: 'indigo',
  parent: 'green',
};

export const ANNOUNCEMENTS_DEFAULT_LIMIT = 10;

export const announcementQueryKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementQueryKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...announcementQueryKeys.lists(), { page, limit }] as const,
  details: () => [...announcementQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementQueryKeys.details(), id] as const,
};

import type { Metadata } from 'next';
import { AnnouncementsView } from '@/features/announcements';

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'School notices and announcements',
};

export default function AnnouncementsPage() {
  return <AnnouncementsView />;
}

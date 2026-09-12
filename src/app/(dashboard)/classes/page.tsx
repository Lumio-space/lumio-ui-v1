/**
 * Classes Page — /classes
 *
 * Thin server component: sets metadata and delegates all rendering
 * to ClassesView (client component with TanStack Query + modals).
 */

import type { Metadata } from 'next';
import { ClassesView }   from '@/features/classes';

export const metadata: Metadata = {
  title: 'Classes',
};

export default function ClassesPage() {
  return <ClassesView />;
}

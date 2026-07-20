/**
 * Teachers Page — /teachers
 *
 * Phase 1: Stub. Full implementation in Phase 4.
 */

import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/PageHeader';

export const metadata: Metadata = { title: 'Teachers' };

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles and workload"
      />
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-12 text-center">
        <p className="font-semibold text-indigo-700">Full page coming in Phase 4</p>
      </div>
    </div>
  );
}

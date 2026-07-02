/**
 * Parents Page — /parents
 *
 * Phase 1: Stub. Full implementation in Phase 4.
 */

import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/PageHeader';

export const metadata: Metadata = { title: 'Parents' };

export default function ParentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        description="Parent contacts and communications"
      />
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-12 text-center">
        <p className="font-semibold text-indigo-700">Full page coming in Phase 4</p>
        <p className="mt-1 text-sm text-indigo-400">
          Migrating from the React + Vite version
        </p>
      </div>
    </div>
  );
}

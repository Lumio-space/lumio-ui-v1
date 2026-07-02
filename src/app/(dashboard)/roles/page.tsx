/**
 * Roles Page — /roles
 *
 * Phase 1: Stub. Full implementation in Phase 6.
 */

import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/PageHeader';

export const metadata: Metadata = { title: 'Roles' };

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="User roles and permissions"
      />
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-12 text-center">
        <p className="font-semibold text-indigo-700">Full page coming in Phase 6</p>
        <p className="mt-1 text-sm text-indigo-400">
          Migrating from the React + Vite version
        </p>
      </div>
    </div>
  );
}

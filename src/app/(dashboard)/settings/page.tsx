/**
 * Settings Page — /settings
 */

import type { Metadata } from 'next';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SettingsView } from '@/features/settings';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <SettingsView />
    </RoleGuard>
  );
}

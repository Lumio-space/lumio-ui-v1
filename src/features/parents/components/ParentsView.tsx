'use client';

import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  SearchIcon,
  UsersIcon,
  AlertCircleIcon,
  GraduationCapIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { InviteParentModal } from '@/features/invitations/components/InviteParentModal';
import { useParents } from '../hooks';
import type { ParentRecord } from '../types';
import { ParentCard } from './ParentCard';
import { ParentDetailModal } from './ParentDetailModal';

export function ParentsView() {
  const [query, setQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);

  const { data: parentsResponse, isLoading, isError, error, refetch } = useParents();

  const allParents = useMemo(() => {
    return parentsResponse?.data || [];
  }, [parentsResponse]);

  const filteredParents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allParents;

    return allParents.filter((p) => {
      const matchParent =
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q));

      const matchChild = p.children.some(
        (c) =>
          c.studentName.toLowerCase().includes(q) ||
          (c.className && c.className.toLowerCase().includes(q))
      );

      return matchParent || matchChild;
    });
  }, [allParents, query]);

  // Derived metrics
  const totalChildren = useMemo(() => {
    return allParents.reduce((acc, p) => acc + p.children.length, 0);
  }, [allParents]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        description="Parent directory, linked children and contact details."
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setInviteOpen(true)}
          >
            Invite parent
          </Button>
        }
      />

      {/* Summary KPI Chips */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-400">Total Parents</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-indigo-800">
            {allParents.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-400">Active Accounts</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-emerald-600">
            {allParents.filter((p) => p.status === 'Active').length}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-400">Linked Students</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-purple-600">
            {totalChildren}
          </p>
        </div>
      </div>

      {/* Search Bar matching lumio-react Card design */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parents or linked children…"
            aria-label="Search parents"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm text-slate-400 shadow-card">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Loading parent directory...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-card">
          <AlertCircleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="font-semibold text-slate-800">Failed to load parents</p>
          <p className="mt-1 text-sm text-slate-500">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : filteredParents.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" />}
          title={query ? 'No parents found' : 'No parents registered yet'}
          description={
            query
              ? `No parents or children found matching "${query}".`
              : 'Use the "Invite parent" button above to send account invitations to parents.'
          }
          action={
            query ? (
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear search
              </Button>
            ) : (
              <Button
                leftIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => setInviteOpen(true)}
              >
                Invite parent
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredParents.map((p) => (
            <ParentCard
              key={p.id || p.name}
              parent={p}
              onSelect={(parent) => setSelectedParent(parent)}
            />
          ))}
        </div>
      )}

      {/* Invite Parent Modal (reusing existing tested Next.js invite modal) */}
      <InviteParentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvitationCreated={() => {
          refetch();
        }}
      />

      {/* Parent Detail Profile Modal */}
      <ParentDetailModal
        open={Boolean(selectedParent)}
        onClose={() => setSelectedParent(null)}
        parent={selectedParent}
      />
    </div>
  );
}

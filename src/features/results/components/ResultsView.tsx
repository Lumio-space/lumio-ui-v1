'use client';

import { useState } from 'react';
import {
  AlertCircleIcon,
  ClipboardListIcon,
  CreditCardIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs } from '@/components/shared/Tabs';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/stores/auth.store';
import { ClassResultsWorkspace } from './ClassResultsWorkspace';
import { ResultCardBatchPanel } from './ResultCardBatchPanel';
import { StudentRedeemCardView } from './StudentRedeemCardView';

export function ResultsView() {
  const role = useAuthStore((s) => s.role);
  const [adminTab, setAdminTab] = useState<'class-results' | 'scratch-cards'>(
    'class-results'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        description={
          role === 'admin'
            ? 'Review class grade sheets, publish term results, and manage result scratch-card batches.'
            : role === 'teacher'
            ? 'Manage draft term results for classes where you are appointed as Form Teacher.'
            : role === 'student'
            ? 'Redeem a result scratch card to view your published term grades.'
            : 'Academic results status.'
        }
      />

      {role === 'admin' && (
        <>
          <Tabs
            active={adminTab}
            onChange={(id) =>
              setAdminTab(id as 'class-results' | 'scratch-cards')
            }
            tabs={[
              {
                id: 'class-results',
                label: 'Class Results',
                icon: <ClipboardListIcon className="h-4 w-4" />,
              },
              {
                id: 'scratch-cards',
                label: 'Result Scratch Cards',
                icon: <CreditCardIcon className="h-4 w-4" />,
              },
            ]}
          />

          {adminTab === 'class-results' ? (
            <ClassResultsWorkspace />
          ) : (
            <ResultCardBatchPanel />
          )}
        </>
      )}

      {role === 'teacher' && <ClassResultsWorkspace />}

      {role === 'student' && <StudentRedeemCardView />}

      {role === 'parent' && (
        <Card className="border-slate-100 bg-white shadow-card">
          <EmptyState
            icon={<AlertCircleIcon className="h-7 w-7" />}
            title="Parent results viewing is unavailable"
            description="The backend API does not currently provide a direct parent-facing results endpoint, and scratch-card redemption is restricted to student accounts."
          />
        </Card>
      )}
    </div>
  );
}

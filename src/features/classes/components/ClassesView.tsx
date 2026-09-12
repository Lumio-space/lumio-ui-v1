'use client';

import { useState }      from 'react';
import { PlusIcon, BookOpenIcon, RefreshCwIcon } from 'lucide-react';
import { motion }        from 'framer-motion';

import { PageHeader }  from '@/components/shared/PageHeader';
import { EmptyState }  from '@/components/shared/EmptyState';
import { Button }      from '@/components/ui/button';

import { useClasses }       from '../hooks';
import { ClassCard }        from './ClassCard';
import { ClassModal }       from './ClassModal';
import { ClassDetailModal } from './ClassDetailModal';
import { CreateClassForm }  from './CreateClassForm';
import type { ClassRecord } from '../types';

export function ClassesView() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailClass, setDetailClass]         = useState<ClassRecord | null>(null);
  const { data: classes, isLoading, isError, error, refetch } = useClasses();

  return (
    <div className="space-y-6">

      {/* Page header */}
      <PageHeader
        title="Classes"
        description="Create classes, allocate students and assign teachers."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create class
          </Button>
        }
      />

      {/* Loading skeleton — card grid */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <div className="h-24 animate-pulse bg-indigo-900/40" />
              <div className="space-y-3 bg-white p-5">
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <p className="font-semibold text-red-700">
            {error instanceof Error ? error.message : 'Failed to load classes.'}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCwIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && classes?.length === 0 && (
        <EmptyState
          icon={<BookOpenIcon className="h-7 w-7" />}
          title="No classes yet"
          description="Get started by creating your first class. Classes group students by school level and arm."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Create first class
            </Button>
          }
        />
      )}

      {/* Class card grid */}
      {!isLoading && !isError && classes && classes.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex"
            >
              <div className="w-full">
                <ClassCard
                  classRecord={cls}
                  onViewDetails={(c) => setDetailClass(c)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create class modal */}
      <ClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create new class"
        description="Select the school level, class level, class arm, room, and capacity."
      >
        <CreateClassForm onSuccess={() => setCreateModalOpen(false)} onCancel={() => setCreateModalOpen(false)} />
      </ClassModal>

      {/* Class details modal */}
      <ClassDetailModal
        open={!!detailClass}
        onClose={() => setDetailClass(null)}
        classRecord={detailClass}
      />
    </div>
  );
}

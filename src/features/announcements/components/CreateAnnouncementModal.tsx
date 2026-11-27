'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ANNOUNCEMENT_AUDIENCES } from '../constants';
import {
  createAnnouncementSchema,
  type CreateAnnouncementFormInput,
  type CreateAnnouncementFormValues,
} from '../schemas';
import { useCreateAnnouncement } from '../hooks';
import type { AnnouncementAudience, AnnouncementRecord } from '../types';

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: AnnouncementRecord) => void;
}

export function CreateAnnouncementModal({
  open,
  onClose,
  onCreated,
}: CreateAnnouncementModalProps) {
  const createMutation = useCreateAnnouncement();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementFormInput, unknown, CreateAnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      title: '',
      message: '',
      audiences: [],
    },
  });

  const selectedAudiences = useWatch({ control, name: 'audiences' }) ?? [];
  const titleValue = useWatch({ control, name: 'title' }) ?? '';
  const messageValue = useWatch({ control, name: 'message' }) ?? '';

  function handleClose() {
    if (createMutation.isPending) return;
    reset({ title: '', message: '', audiences: [] });
    setSubmitError(null);
    onClose();
  }

  function toggleAudience(audience: AnnouncementAudience) {
    const exists = selectedAudiences.includes(audience);
    const next = exists
      ? selectedAudiences.filter((a) => a !== audience)
      : [...selectedAudiences, audience];
    setValue('audiences', next, { shouldValidate: true, shouldDirty: true });
  }

  function onSubmit(values: CreateAnnouncementFormValues) {
    setSubmitError(null);
    createMutation.mutate(values, {
      onSuccess: (created) => {
        reset({ title: '', message: '', audiences: [] });
        setSubmitError(null);
        onCreated?.(created);
        onClose();
      },
      onError: (err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to publish announcement. Please try again.';
        setSubmitError(message);
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New announcement"
      description="Publish a notice to selected school audiences."
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-announcement-form"
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
          >
            Publish announcement
          </Button>
        </>
      }
    >
      <form
        id="create-announcement-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="announcement-title">Title</Label>
            <span className="text-xs text-slate-400">
              {titleValue.trim().length}/150
            </span>
          </div>
          <Input
            id="announcement-title"
            placeholder="e.g. Mid-Term Examination Schedule"
            maxLength={150}
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          {errors.title && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="announcement-message">Message</Label>
            <span className="text-xs text-slate-400">
              {messageValue.trim().length}/5000
            </span>
          </div>
          <textarea
            id="announcement-message"
            rows={5}
            maxLength={5000}
            placeholder="Write the full announcement details…"
            aria-invalid={Boolean(errors.message)}
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100',
              errors.message && 'border-red-300 focus:border-red-400 focus:ring-red-100'
            )}
            {...register('message')}
          />
          {errors.message && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.message.message}
            </p>
          )}
        </div>

        <div>
          <Label className="mb-2 block">Target audiences</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {ANNOUNCEMENT_AUDIENCES.map((item) => {
              const checked = selectedAudiences.includes(item.value);
              return (
                <label
                  key={item.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors',
                    checked
                      ? 'border-purple-400 bg-purple-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAudience(item.value)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                    <span className="block text-[11px] leading-snug text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.audiences && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.audiences.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

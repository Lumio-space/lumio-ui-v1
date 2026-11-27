'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClassResults,
  saveClassResults,
  publishClassResults,
  createResultCardBatch,
  fetchBatchCards,
  redeemResultCard,
} from '../api/results.api';
import { resultQueryKeys } from '../constants';
import type {
  CreateResultCardBatchPayload,
  PublishClassResultsPayload,
  RedeemResultCardPayload,
  ResultTerm,
  SaveClassResultsPayload,
} from '../types';

export function useClassResults(
  classId: string,
  academicYear: string,
  term: ResultTerm
) {
  return useQuery({
    queryKey: resultQueryKeys.classResults(classId, academicYear.trim(), term),
    queryFn: () => fetchClassResults(classId, academicYear, term),
    enabled: Boolean(classId && academicYear.trim() && term),
  });
}

export function useSaveClassResults(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveClassResultsPayload) =>
      saveClassResults(classId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: resultQueryKeys.classResults(
          classId,
          variables.academicYear.trim(),
          variables.term
        ),
      });
    },
  });
}

export function usePublishClassResults(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PublishClassResultsPayload) =>
      publishClassResults(classId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: resultQueryKeys.classResults(
          classId,
          variables.academicYear.trim(),
          variables.term
        ),
      });
    },
  });
}

export function useCreateResultCardBatch() {
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateResultCardBatchPayload;
      idempotencyKey: string;
    }) => createResultCardBatch(payload, idempotencyKey),
  });
}

export function useBatchCards(batchId: string | null) {
  return useQuery({
    queryKey: resultQueryKeys.batchCards(batchId ?? ''),
    queryFn: () => fetchBatchCards(batchId as string),
    enabled: Boolean(batchId && batchId.trim().length > 0),
    retry: false,
  });
}

export function useRedeemResultCard() {
  return useMutation({
    mutationFn: (payload: RedeemResultCardPayload) => redeemResultCard(payload),
  });
}

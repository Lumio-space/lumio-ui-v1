/**
 * Results API Service
 *
 * Backend contracts:
 *   GET  /results/classes/:classId?academicYear=&term= → getClassResults
 *   POST /results/classes/:classId                     → saveClassResults
 *   POST /results/classes/:classId/publish             → publishClassResults
 *   POST /result-card-batches                          → createBatch (requires Idempotency-Key)
 *   GET  /result-card-batches/:batchId/cards           → getGeneratedCards
 *   POST /results/redeem-card                          → redeemCard
 */

import { apiClient } from '@/lib/api/axios';
import type {
  BatchCardsResponse,
  ClassStudentResults,
  CreateResultCardBatchPayload,
  CreateResultCardBatchResponse,
  PublishClassResultsPayload,
  PublishClassResultsResponse,
  RedeemResultCardPayload,
  RedeemResultCardResponse,
  ResultTerm,
  SaveClassResultsPayload,
  SaveClassResultsResponse,
} from '../types';

export async function fetchClassResults(
  classId: string,
  academicYear: string,
  term: ResultTerm
): Promise<ClassStudentResults[]> {
  const response = await apiClient.get<ClassStudentResults[]>(
    `/results/classes/${classId}`,
    {
      params: {
        academicYear: academicYear.trim(),
        term,
      },
    }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function saveClassResults(
  classId: string,
  payload: SaveClassResultsPayload
): Promise<SaveClassResultsResponse> {
  const response = await apiClient.post<SaveClassResultsResponse>(
    `/results/classes/${classId}`,
    {
      academicYear: payload.academicYear.trim(),
      term: payload.term,
      entries: payload.entries,
    }
  );
  return response.data;
}

export async function publishClassResults(
  classId: string,
  payload: PublishClassResultsPayload
): Promise<PublishClassResultsResponse> {
  const response = await apiClient.post<PublishClassResultsResponse>(
    `/results/classes/${classId}/publish`,
    {
      academicYear: payload.academicYear.trim(),
      term: payload.term,
    }
  );
  return response.data;
}

export async function createResultCardBatch(
  payload: CreateResultCardBatchPayload,
  idempotencyKey: string
): Promise<CreateResultCardBatchResponse> {
  const response = await apiClient.post<CreateResultCardBatchResponse>(
    '/result-card-batches',
    {
      quantity: payload.quantity,
      academicYear: payload.academicYear.trim(),
      term: payload.term,
    },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  return response.data;
}

export async function fetchBatchCards(batchId: string): Promise<BatchCardsResponse> {
  const response = await apiClient.get<BatchCardsResponse>(
    `/result-card-batches/${batchId.trim()}/cards`
  );
  return response.data;
}

export async function redeemResultCard(
  payload: RedeemResultCardPayload
): Promise<RedeemResultCardResponse> {
  const response = await apiClient.post<RedeemResultCardResponse>(
    '/results/redeem-card',
    {
      serialNumber: payload.serialNumber.trim(),
      pin: payload.pin.trim(),
      academicYear: payload.academicYear.trim(),
      term: payload.term,
    }
  );
  return response.data;
}

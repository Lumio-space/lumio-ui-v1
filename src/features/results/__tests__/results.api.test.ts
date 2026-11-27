import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchClassResults,
  saveClassResults,
  publishClassResults,
  createResultCardBatch,
  fetchBatchCards,
  redeemResultCard,
} from '../api/results.api';
import { apiClient } from '@/lib/api/axios';
import { resultEntryScoreSchema } from '../schemas';

vi.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('results.api & validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchClassResults requests GET /results/classes/:classId with academicYear and term params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          studentId: 'stu-1',
          fullName: 'Ada Lovelace',
          results: [],
        },
      ],
    });

    const res = await fetchClassResults('cls-1', ' 2026/2027 ', 'first_term');

    expect(apiClient.get).toHaveBeenCalledWith('/results/classes/cls-1', {
      params: { academicYear: '2026/2027', term: 'first_term' },
    });
    expect(res).toHaveLength(1);
  });

  it('saveClassResults posts exact contract to POST /results/classes/:classId', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, message: 'Results saved successfully', count: 1 },
    });

    const res = await saveClassResults('cls-1', {
      academicYear: '2026/2027',
      term: 'first_term',
      entries: [
        {
          studentId: 'stu-1',
          classSubjectId: 'cs-1',
          testScore: 15,
          caScore: 20,
          examScore: 55,
        },
      ],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/results/classes/cls-1', {
      academicYear: '2026/2027',
      term: 'first_term',
      entries: [
        {
          studentId: 'stu-1',
          classSubjectId: 'cs-1',
          testScore: 15,
          caScore: 20,
          examScore: 55,
        },
      ],
    });
    expect(res.count).toBe(1);
  });

  it('publishClassResults posts academicYear and term to POST /results/classes/:classId/publish', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Results published successfully',
        publishedCount: 5,
        alreadyPublishedCount: 0,
      },
    });

    const res = await publishClassResults('cls-1', {
      academicYear: '2026/2027',
      term: 'second_term',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/results/classes/cls-1/publish', {
      academicYear: '2026/2027',
      term: 'second_term',
    });
    expect(res.publishedCount).toBe(5);
  });

  it('createResultCardBatch sends Idempotency-Key header and payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        batchId: 'batch-1',
        paymentReference: 'RCB-1',
        checkoutId: 'chk-1',
        checkoutUrl: 'https://checkout.example/1',
        paymentStatus: 'pending',
      },
    });

    const res = await createResultCardBatch(
      { quantity: 25, academicYear: '2026/2027', term: 'first_term' },
      'idem-123'
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      '/result-card-batches',
      { quantity: 25, academicYear: '2026/2027', term: 'first_term' },
      { headers: { 'Idempotency-Key': 'idem-123' } }
    );
    expect(res.batchId).toBe('batch-1');
  });

  it('fetchBatchCards calls GET /result-card-batches/:batchId/cards', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        batchId: 'batch-1',
        academicYear: '2026/2027',
        term: 'first_term',
        cards: [{ serialNumber: 'LUMIO-2026-AAA', pin: '123456', status: 'available' }],
      },
    });

    const res = await fetchBatchCards('batch-1');
    expect(apiClient.get).toHaveBeenCalledWith('/result-card-batches/batch-1/cards');
    expect(res.cards).toHaveLength(1);
  });

  it('redeemResultCard calls POST /results/redeem-card', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        success: true,
        student: { id: 'stu-1', fullName: 'Ada Lovelace' },
        academicYear: '2026/2027',
        term: 'first_term',
        usesRemaining: 4,
        results: [],
      },
    });

    const res = await redeemResultCard({
      serialNumber: ' LUMIO-2026-AAA ',
      pin: ' 123456 ',
      academicYear: ' 2026/2027 ',
      term: 'first_term',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/results/redeem-card', {
      serialNumber: 'LUMIO-2026-AAA',
      pin: '123456',
      academicYear: '2026/2027',
      term: 'first_term',
    });
    expect(res.usesRemaining).toBe(4);
  });

  it('resultEntryScoreSchema respects backend constraint rejecting totalScore >= 100', () => {
    expect(
      resultEntryScoreSchema.safeParse({ testScore: 20, caScore: 20, examScore: 59 })
        .success
    ).toBe(true);
    expect(
      resultEntryScoreSchema.safeParse({ testScore: 20, caScore: 20, examScore: 60 })
        .success
    ).toBe(false);
  });
});

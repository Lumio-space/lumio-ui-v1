'use client';

import { useState } from 'react';
import {
  AlertCircleIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  InfoIcon,
  KeyRoundIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/shared/Badge';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import {
  RESULT_TERMS,
  TERM_LABELS,
  getDefaultAcademicYear,
} from '../constants';
import { createResultCardBatchSchema } from '../schemas';
import { useBatchCards, useCreateResultCardBatch } from '../hooks';
import type { CreateResultCardBatchResponse, ResultTerm } from '../types';

export function ResultCardBatchPanel() {
  const [quantity, setQuantity] = useState('10');
  const [academicYear, setAcademicYear] = useState(getDefaultAcademicYear);
  const [term, setTerm] = useState<ResultTerm>('first_term');
  const [formError, setFormError] = useState<string | null>(null);

  const [createdBatch, setCreatedBatch] =
    useState<CreateResultCardBatchResponse | null>(null);
  const [lookupBatchIdInput, setLookupBatchIdInput] = useState('');
  const [activeLookupBatchId, setActiveLookupBatchId] = useState<string | null>(
    null
  );

  const createBatchMutation = useCreateResultCardBatch();
  const {
    data: cardsData,
    isLoading: cardsLoading,
    isError: cardsError,
    error: cardsErrorObj,
    refetch: refetchCards,
    isFetching: cardsFetching,
  } = useBatchCards(activeLookupBatchId);

  function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createResultCardBatchSchema.safeParse({
      quantity: Number(quantity),
      academicYear,
      term,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid batch input.');
      return;
    }

    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    createBatchMutation.mutate(
      {
        payload: parsed.data,
        idempotencyKey,
      },
      {
        onSuccess: (res) => {
          setCreatedBatch(res);
          setLookupBatchIdInput(res.batchId);
          setActiveLookupBatchId(res.batchId);
        },
        onError: (err) => {
          setFormError(
            err instanceof Error
              ? err.message
              : 'Failed to initiate result card batch.'
          );
        },
      }
    );
  }

  function handleLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupBatchIdInput.trim()) return;
    setActiveLookupBatchId(lookupBatchIdInput.trim());
  }

  return (
    <div className="space-y-6">
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-900"
      >
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
        <span>
          The backend does not provide an endpoint to list previously purchased scratch-card batches. Record your Batch ID after creating a batch if you need to check generated cards later.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-purple-600" />
              Purchase scratch-card batch
            </CardTitle>
            <CardDescription>
              Create a paid batch (1–500 cards) for a specific academic period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBatch} className="space-y-4" noValidate>
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <Label htmlFor="batch-quantity" className="mb-1.5 block">
                  Quantity (1–500)
                </Label>
                <Input
                  id="batch-quantity"
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="batch-academic-year" className="mb-1.5 block">
                    Academic year
                  </Label>
                  <Input
                    id="batch-academic-year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2026/2027"
                  />
                </div>
                <div>
                  <Label htmlFor="batch-term" className="mb-1.5 block">
                    Term
                  </Label>
                  <select
                    id="batch-term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value as ResultTerm)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  >
                    {RESULT_TERMS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                loading={createBatchMutation.isPending}
                disabled={createBatchMutation.isPending}
                className="w-full"
              >
                Create batch & checkout
              </Button>
            </form>

            {createdBatch && (
              <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Batch created</span>
                  <Badge tone="indigo">{createdBatch.paymentStatus}</Badge>
                </div>
                <p className="text-slate-600">
                  Batch ID:{' '}
                  <code className="font-mono font-semibold text-slate-900">
                    {createdBatch.batchId}
                  </code>
                </p>
                <p className="text-slate-600">
                  Reference:{' '}
                  <code className="font-mono text-slate-800">
                    {createdBatch.paymentReference}
                  </code>
                </p>
                {createdBatch.amountNaira !== undefined && (
                  <p className="text-slate-600">
                    Amount: {createdBatch.currency ?? 'NGN'}{' '}
                    {createdBatch.amountNaira.toLocaleString()}
                  </p>
                )}
                {createdBatch.checkoutUrl && (
                  <a
                    href={createdBatch.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold text-purple-700 hover:underline"
                  >
                    Proceed to payment checkout
                    <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRoundIcon className="h-5 w-5 text-indigo-700" />
              Retrieve generated cards
            </CardTitle>
            <CardDescription>
              Check card generation status for a paid batch using its Batch ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLookupSubmit} className="flex gap-2">
              <Input
                aria-label="Batch ID"
                placeholder="Enter Batch ID (UUID)…"
                value={lookupBatchIdInput}
                onChange={(e) => setLookupBatchIdInput(e.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!lookupBatchIdInput.trim() || cardsFetching}
              >
                Load
              </Button>
            </form>

            {cardsLoading && (
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            )}

            {cardsError && !cardsLoading && (
              <div
                role="alert"
                className="flex flex-col items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
              >
                <p className="font-semibold">
                  {cardsErrorObj instanceof Error
                    ? cardsErrorObj.message
                    : 'Unable to fetch batch cards.'}
                </p>
                {activeLookupBatchId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchCards()}
                    leftIcon={<RefreshCwIcon className="h-3.5 w-3.5" />}
                  >
                    Check again
                  </Button>
                )}
              </div>
            )}

            {cardsData && !cardsLoading && !cardsError && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>
                    {cardsData.academicYear} · {TERM_LABELS[cardsData.term]}
                  </span>
                  <span className="font-semibold">
                    {cardsData.cards.length} card
                    {cardsData.cards.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
                  <Table>
                    <THead>
                      <tr>
                        <TH>Serial number</TH>
                        <TH>PIN</TH>
                        <TH>Status</TH>
                      </tr>
                    </THead>
                    <tbody>
                      {cardsData.cards.map((card) => (
                        <TR key={card.serialNumber}>
                          <TD className="font-mono text-xs">{card.serialNumber}</TD>
                          <TD className="font-mono text-xs font-bold">{card.pin}</TD>
                          <TD>
                            <Badge tone="slate">{card.status}</Badge>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

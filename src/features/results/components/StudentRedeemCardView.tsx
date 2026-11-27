'use client';

import { useState } from 'react';
import {
  AlertCircleIcon,
  AwardIcon,
  KeyRoundIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/shared/Badge';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import {
  GRADE_TONES,
  RESULT_TERMS,
  TERM_LABELS,
  getDefaultAcademicYear,
} from '../constants';
import { redeemResultCardSchema } from '../schemas';
import { useRedeemResultCard } from '../hooks';
import type { RedeemResultCardResponse, ResultTerm } from '../types';

export function StudentRedeemCardView() {
  const [serialNumber, setSerialNumber] = useState('');
  const [pin, setPin] = useState('');
  const [academicYear, setAcademicYear] = useState(getDefaultAcademicYear);
  const [term, setTerm] = useState<ResultTerm>('first_term');
  const [formError, setFormError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<RedeemResultCardResponse | null>(null);

  const redeemMutation = useRedeemResultCard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = redeemResultCardSchema.safeParse({
      serialNumber,
      pin,
      academicYear,
      term,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid scratch card details.');
      return;
    }

    redeemMutation.mutate(parsed.data, {
      onSuccess: (res) => {
        setRedeemed(res);
      },
      onError: (err) => {
        setFormError(
          err instanceof Error
            ? err.message
            : 'Unable to redeem scratch card.'
        );
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-100 bg-white shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="h-5 w-5 text-purple-600" />
            Check term results
          </CardTitle>
          <CardDescription>
            Enter your result scratch-card serial number and PIN to view published results for an academic period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="redeem-serial" className="mb-1.5 block">
                  Serial number
                </Label>
                <Input
                  id="redeem-serial"
                  placeholder="e.g. LUMIO-2026-..."
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="redeem-pin" className="mb-1.5 block">
                  PIN
                </Label>
                <Input
                  id="redeem-pin"
                  type="password"
                  placeholder="6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="redeem-academic-year" className="mb-1.5 block">
                  Academic year
                </Label>
                <Input
                  id="redeem-academic-year"
                  placeholder="e.g. 2026/2027"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="redeem-term" className="mb-1.5 block">
                  Term
                </Label>
                <select
                  id="redeem-term"
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
              loading={redeemMutation.isPending}
              disabled={redeemMutation.isPending}
            >
              View published results
            </Button>
          </form>
        </CardContent>
      </Card>

      {redeemed && (
        <Card className="overflow-hidden border-slate-100 bg-white shadow-card">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AwardIcon className="h-5 w-5 text-gold-500" />
                {redeemed.student.fullName}
              </CardTitle>
              <CardDescription>
                {redeemed.academicYear} · {TERM_LABELS[redeemed.term]}
              </CardDescription>
            </div>
            <Badge tone="indigo">
              {redeemed.usesRemaining} card use
              {redeemed.usesRemaining === 1 ? '' : 's'} remaining
            </Badge>
          </CardHeader>
          <Table>
            <THead>
              <tr>
                <TH>Subject</TH>
                <TH>Test</TH>
                <TH>CA</TH>
                <TH>Exam</TH>
                <TH>Total</TH>
                <TH>Grade</TH>
                <TH>Remark</TH>
              </tr>
            </THead>
            <tbody>
              {redeemed.results.map((item) => (
                <TR key={item.resultId}>
                  <TD className="font-semibold text-slate-800">
                    {item.subjectTitle}
                  </TD>
                  <TD>{item.testScore}</TD>
                  <TD>{item.caScore}</TD>
                  <TD>{item.examScore}</TD>
                  <TD className="font-bold text-slate-900">{item.totalScore}</TD>
                  <TD>
                    <Badge tone={GRADE_TONES[item.grade]}>{item.grade}</Badge>
                  </TD>
                  <TD className="text-slate-600">{item.remark}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

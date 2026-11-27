'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  RefreshCwIcon,
  SaveIcon,
  SendIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { Table, THead, TH, TR, TD } from '@/components/shared/Table';
import { useAuthStore } from '@/stores/auth.store';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  extractActiveClasses,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import {
  GRADE_TONES,
  RESULT_STATUS_LABELS,
  RESULT_STATUS_TONES,
  RESULT_TERMS,
  TERM_LABELS,
  getDefaultAcademicYear,
} from '../constants';
import { resultEntryScoreSchema } from '../schemas';
import {
  useClassResults,
  usePublishClassResults,
  useSaveClassResults,
} from '../hooks';
import type { ResultTerm, SaveResultEntryPayload } from '../types';

interface DraftScoreValues {
  testScore: string;
  caScore: string;
  examScore: string;
}

export function ClassResultsWorkspace() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const rawBackendRole = user?.role?.toUpperCase();

  const isTeacher = role === 'teacher';
  const isSuperAdmin = rawBackendRole === 'SUPER_ADMIN';
  const isSchoolAdmin = role === 'admin' && !isSuperAdmin;

  // Backend permissions:
  // - GRADE_CREATE is granted only to TEACHER (form teacher) and SUPER_ADMIN (missing from SCHOOL_ADMIN)
  // - GRADE_PUBLISH is enforced in ResultService only for SCHOOL_ADMIN
  const canSaveScores = isTeacher || isSuperAdmin;
  const canPublishScores = isSchoolAdmin;

  const {
    data: rawClasses = [],
    isLoading: classesLoading,
    isError: classesError,
    error: classesErrorObj,
  } = useClasses();

  const activeClasses = useMemo(
    () => extractActiveClasses<ClassRecord>(rawClasses),
    [rawClasses]
  );

  const userId = user?.id;
  const availableClasses = useMemo(() => {
    if (!isTeacher) return activeClasses;
    if (!userId) return [];
    return activeClasses.filter((c) => c.formTeacher === userId);
  }, [activeClasses, isTeacher, userId]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>(getDefaultAcademicYear);
  const [term, setTerm] = useState<ResultTerm>('first_term');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('overview');

  const [draftScores, setDraftScores] = useState<Record<string, DraftScoreValues>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const effectiveClassId = useMemo(() => {
    if (availableClasses.length === 0) return '';
    return availableClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : availableClasses[0].id;
  }, [availableClasses, selectedClassId]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const {
    data: classResults = [],
    isLoading: resultsLoading,
    isError: resultsError,
    error: resultsErrorObj,
    refetch,
    isFetching,
  } = useClassResults(effectiveClassId, academicYear, term);

  const saveMutation = useSaveClassResults(effectiveClassId);
  const publishMutation = usePublishClassResults(effectiveClassId);

  const classSubjects = useMemo(() => {
    if (classResults.length === 0) return [];
    return classResults[0].results.map((r) => ({
      classSubjectId: r.classSubjectId,
      subjectId: r.subjectId,
      subjectTitle: r.subjectTitle,
    }));
  }, [classResults]);

  const effectiveSubjectId = useMemo(() => {
    if (
      selectedSubjectId !== 'overview' &&
      classSubjects.some((s) => s.classSubjectId === selectedSubjectId)
    ) {
      return selectedSubjectId;
    }
    return 'overview';
  }, [classSubjects, selectedSubjectId]);

  function resetDraftState() {
    setDraftScores({});
    setRowErrors({});
    setActionError(null);
  }

  const selectedClassObj = useMemo(
    () => availableClasses.find((c) => c.id === effectiveClassId) ?? null,
    [availableClasses, effectiveClassId]
  );

  const hasDraftResults = useMemo(
    () =>
      classResults.some((student) =>
        student.results.some((r) => r.status === 'draft')
      ),
    [classResults]
  );

  function getScoreInputValue(
    studentId: string,
    field: keyof DraftScoreValues,
    existing: number | null
  ): string {
    const draft = draftScores[studentId];
    if (draft && draft[field] !== undefined) return draft[field];
    return existing === null || existing === undefined ? '' : String(existing);
  }

  function handleScoreChange(
    studentId: string,
    field: keyof DraftScoreValues,
    value: string,
    existing: { testScore: number | null; caScore: number | null; examScore: number | null }
  ) {
    setDraftScores((prev) => {
      const current = prev[studentId] ?? {
        testScore: existing.testScore !== null ? String(existing.testScore) : '',
        caScore: existing.caScore !== null ? String(existing.caScore) : '',
        examScore: existing.examScore !== null ? String(existing.examScore) : '',
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value,
        },
      };
    });
    setRowErrors((prev) => {
      if (!(studentId in prev)) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  }

  function handleSaveSubjectScores() {
    if (!effectiveClassId || effectiveSubjectId === 'overview') return;
    setActionError(null);
    setSuccessMessage(null);

    const nextRowErrors: Record<string, string> = {};
    const entries: SaveResultEntryPayload[] = [];

    for (const student of classResults) {
      const subjectRow = student.results.find(
        (r) => r.classSubjectId === effectiveSubjectId
      );
      if (!subjectRow || subjectRow.status === 'published') continue;

      const draft = draftScores[student.studentId];
      if (!draft) continue;

      const testRaw = draft.testScore.trim();
      const caRaw = draft.caScore.trim();
      const examRaw = draft.examScore.trim();

      if (testRaw === '' && caRaw === '' && examRaw === '') continue;

      if (testRaw === '' || caRaw === '' || examRaw === '') {
        nextRowErrors[student.studentId] =
          'Enter Test, CA, and Exam scores for this student.';
        continue;
      }

      const parsed = resultEntryScoreSchema.safeParse({
        testScore: Number(testRaw),
        caScore: Number(caRaw),
        examScore: Number(examRaw),
      });

      if (!parsed.success) {
        nextRowErrors[student.studentId] =
          parsed.error.issues[0]?.message ?? 'Invalid score entry.';
        continue;
      }

      entries.push({
        studentId: student.studentId,
        classSubjectId: effectiveSubjectId,
        testScore: parsed.data.testScore,
        caScore: parsed.data.caScore,
        examScore: parsed.data.examScore,
      });
    }

    setRowErrors(nextRowErrors);

    if (Object.keys(nextRowErrors).length > 0) {
      setActionError('Fix the highlighted score validation errors before saving.');
      return;
    }

    if (entries.length === 0) {
      setActionError('Modify at least one student score before saving.');
      return;
    }

    saveMutation.mutate(
      {
        academicYear: academicYear.trim(),
        term,
        entries,
      },
      {
        onSuccess: (res) => {
          setDraftScores({});
          setSuccessMessage(
            `${res.message} (${res.count} entr${res.count === 1 ? 'y' : 'ies'} saved as draft).`
          );
        },
        onError: (err) => {
          setActionError(
            err instanceof Error ? err.message : 'Failed to save class results.'
          );
        },
      }
    );
  }

  function handleConfirmPublish() {
    if (!effectiveClassId) return;
    setActionError(null);
    setSuccessMessage(null);

    publishMutation.mutate(
      {
        academicYear: academicYear.trim(),
        term,
      },
      {
        onSuccess: (res) => {
          setPublishConfirmOpen(false);
          setSuccessMessage(
            `${res.message} (${res.publishedCount} newly published, ${res.alreadyPublishedCount} already published).`
          );
        },
        onError: (err) => {
          setPublishConfirmOpen(false);
          setActionError(
            err instanceof Error ? err.message : 'Failed to publish class results.'
          );
        },
      }
    );
  }

  if (classesLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (classesError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        {classesErrorObj instanceof Error
          ? classesErrorObj.message
          : 'Unable to load classes.'}
      </div>
    );
  }

  if (availableClasses.length === 0) {
    return (
      <Card className="border-slate-100 bg-white shadow-card">
        <EmptyState
          icon={<ClipboardListIcon className="h-7 w-7" />}
          title={
            isTeacher
              ? 'No Form Teacher classes assigned'
              : 'No classes configured yet'
          }
          description={
            isTeacher
              ? 'Backend class results access is currently restricted to appointed Form Teachers. Subject-teacher-only result access is not yet supported by the backend API.'
              : 'Create classes and assign subjects before managing class results.'
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Role & backend limitation notices */}
      {isSchoolAdmin && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            School Admin accounts can review class scores and publish draft results. Score entry is restricted in the backend RBAC map (GRADE_CREATE is omitted for SCHOOL_ADMIN).
          </span>
        </div>
      )}

      {isSuperAdmin && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            Publishing results is restricted in the backend service to SCHOOL_ADMIN accounts.
          </span>
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-100 bg-white shadow-card">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="results-class-select" className="mb-1.5 block">
                Class
              </Label>
              <select
                id="results-class-select"
                value={effectiveClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  resetDraftState();
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {availableClasses.map((c) => {
                  const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
                  const dept =
                    c.department && c.department !== 'Nill' ? c.department : undefined;
                  return (
                    <option key={c.id} value={c.id}>
                      {composeClassName(gradeLabel, dept, c.section)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <Label htmlFor="results-academic-year" className="mb-1.5 block">
                Academic year
              </Label>
              <Input
                id="results-academic-year"
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  resetDraftState();
                }}
                placeholder="e.g. 2026/2027"
              />
            </div>

            <div>
              <Label htmlFor="results-term-select" className="mb-1.5 block">
                Term
              </Label>
              <select
                id="results-term-select"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value as ResultTerm);
                  resetDraftState();
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {RESULT_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="results-subject-select" className="mb-1.5 block">
                Subject view
              </Label>
              <select
                id="results-subject-select"
                value={effectiveSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  resetDraftState();
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="overview">All subjects (overview)</option>
                {classSubjects.map((s) => (
                  <option key={s.classSubjectId} value={s.classSubjectId}>
                    {s.subjectTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500">
              {effectiveSubjectId === 'overview'
                ? 'Select a specific subject to enter or edit student draft scores.'
                : 'Scores are saved per subject. Backend validation requires Test + CA + Exam < 100.'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching || !academicYear.trim()}
                leftIcon={<RefreshCwIcon className="h-4 w-4" />}
              >
                Refresh
              </Button>

              {effectiveSubjectId !== 'overview' && canSaveScores && (
                <Button
                  size="sm"
                  onClick={handleSaveSubjectScores}
                  loading={saveMutation.isPending}
                  disabled={saveMutation.isPending || classResults.length === 0}
                  leftIcon={<SaveIcon className="h-4 w-4" />}
                >
                  Save draft scores
                </Button>
              )}

              {canPublishScores && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPublishConfirmOpen(true)}
                  disabled={!hasDraftResults || publishMutation.isPending}
                  leftIcon={<SendIcon className="h-4 w-4" />}
                >
                  Publish class results
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      {!academicYear.trim() ? (
        <Card className="border-slate-100 bg-white shadow-card">
          <EmptyState
            icon={<ClipboardListIcon className="h-7 w-7" />}
            title="Academic year required"
            description="Enter an academic year (for example, 2026/2027) to load class results."
          />
        </Card>
      ) : resultsLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />
      ) : resultsError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
        >
          <AlertCircleIcon className="h-7 w-7 text-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-800">
            {resultsErrorObj instanceof Error
              ? resultsErrorObj.message
              : 'Failed to load class results.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Try again
          </Button>
        </div>
      ) : classResults.length === 0 ? (
        <Card className="border-slate-100 bg-white shadow-card">
          <EmptyState
            icon={<ClipboardListIcon className="h-7 w-7" />}
            title="No active students in this class"
            description="Enroll active students and attach subjects to this class before recording results."
          />
        </Card>
      ) : classSubjects.length === 0 ? (
        <Card className="border-slate-100 bg-white shadow-card">
          <EmptyState
            icon={<ClipboardListIcon className="h-7 w-7" />}
            title="No subjects attached to this class"
            description="Attach subjects to this class before entering or viewing results."
          />
        </Card>
      ) : effectiveSubjectId === 'overview' ? (
        <Card className="overflow-hidden border-slate-100 bg-white shadow-card">
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                {classSubjects.map((s) => (
                  <TH key={s.classSubjectId}>{s.subjectTitle}</TH>
                ))}
              </tr>
            </THead>
            <tbody>
              {classResults.map((student) => (
                <TR key={student.studentId}>
                  <TD>
                    <span className="font-semibold text-slate-800">
                      {student.fullName}
                    </span>
                  </TD>
                  {student.results.map((r) => (
                    <TD key={r.classSubjectId}>
                      {r.status === 'not_started' ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {r.totalScore ?? '—'}
                          </span>
                          {r.grade && (
                            <Badge tone={GRADE_TONES[r.grade]}>{r.grade}</Badge>
                          )}
                          <Badge tone={RESULT_STATUS_TONES[r.status]}>
                            {RESULT_STATUS_LABELS[r.status]}
                          </Badge>
                        </div>
                      )}
                    </TD>
                  ))}
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-100 bg-white shadow-card">
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Test</TH>
                <TH>CA</TH>
                <TH>Exam</TH>
                <TH>Total</TH>
                <TH>Grade</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {classResults.map((student) => {
                const row = student.results.find(
                  (r) => r.classSubjectId === effectiveSubjectId
                );
                if (!row) return null;

                const locked = row.status === 'published' || !canSaveScores;
                const testVal = getScoreInputValue(
                  student.studentId,
                  'testScore',
                  row.testScore
                );
                const caVal = getScoreInputValue(
                  student.studentId,
                  'caScore',
                  row.caScore
                );
                const examVal = getScoreInputValue(
                  student.studentId,
                  'examScore',
                  row.examScore
                );

                const hasAllInputs =
                  testVal !== '' && caVal !== '' && examVal !== '';
                const computedTotal = hasAllInputs
                  ? Number(testVal) + Number(caVal) + Number(examVal)
                  : row.totalScore;
                const rowErr = rowErrors[student.studentId];

                return (
                  <TR key={student.studentId}>
                    <TD>
                      <div>
                        <span className="font-semibold text-slate-800">
                          {student.fullName}
                        </span>
                        {rowErr && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {rowErr}
                          </p>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={locked}
                        aria-label={`Test score for ${student.fullName}`}
                        value={testVal}
                        onChange={(e) =>
                          handleScoreChange(
                            student.studentId,
                            'testScore',
                            e.target.value,
                            row
                          )
                        }
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </TD>
                    <TD>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={locked}
                        aria-label={`CA score for ${student.fullName}`}
                        value={caVal}
                        onChange={(e) =>
                          handleScoreChange(
                            student.studentId,
                            'caScore',
                            e.target.value,
                            row
                          )
                        }
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </TD>
                    <TD>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={locked}
                        aria-label={`Exam score for ${student.fullName}`}
                        value={examVal}
                        onChange={(e) =>
                          handleScoreChange(
                            student.studentId,
                            'examScore',
                            e.target.value,
                            row
                          )
                        }
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </TD>
                    <TD>
                      <span
                        className={
                          typeof computedTotal === 'number' && computedTotal >= 100
                            ? 'font-bold text-red-600'
                            : 'font-semibold text-slate-800'
                        }
                      >
                        {computedTotal ?? '—'}
                      </span>
                    </TD>
                    <TD>
                      {row.grade ? (
                        <Badge tone={GRADE_TONES[row.grade]}>{row.grade}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TD>
                    <TD>
                      <Badge tone={RESULT_STATUS_TONES[row.status]}>
                        {RESULT_STATUS_LABELS[row.status]}
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Publish Confirmation Modal */}
      <Modal
        open={publishConfirmOpen}
        onClose={() => {
          if (!publishMutation.isPending) setPublishConfirmOpen(false);
        }}
        title="Publish class results"
        description="Published results cannot be edited afterwards."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPublishConfirmOpen(false)}
              disabled={publishMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPublish}
              loading={publishMutation.isPending}
              disabled={publishMutation.isPending}
            >
              Confirm publish
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to publish all draft results for{' '}
          <strong className="font-semibold text-slate-900">
            {selectedClassObj
              ? `${GRADE_LEVEL_LABELS[selectedClassObj.grade] ?? selectedClassObj.grade} ${selectedClassObj.section}`
              : 'this class'}
          </strong>{' '}
          ({academicYear.trim()} · {TERM_LABELS[term]})?
        </p>
      </Modal>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparklesIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
  onboardingSchema,
  ONBOARDING_STEPS,
  STEP_FIELD_MAP,
  type OnboardingFormValues,
} from '../schemas/onboarding.schema';

import { useAuthStore }                      from '@/stores/auth.store';
import { useSchoolStore }                    from '@/stores/school.store';
import { useOnboardingStore, isDraftExpired } from '@/stores/onboarding.store';
import { setAuthCookie, setSchoolCookie } from '@/features/auth/hooks/useAuth';

import {
  useInitializeDraft,
  DRAFT_INIT_QUERY_KEY,
} from '@/features/onboarding/hooks/useInitializeDraft';
import { useSchoolInfo }           from '@/features/onboarding/hooks/useSchoolInfo';
import { useInstitutionInfo }      from '@/features/onboarding/hooks/useInstitutionInfo';
import { useAcademicSettings }     from '@/features/onboarding/hooks/useAcademicSettings';
import { useAdministrators }       from '@/features/onboarding/hooks/useAdministrators';
import { useCompleteRegistration } from '@/features/onboarding/hooks/useCompleteRegistration';

import { Button }             from '@/components/ui/button';
import { Logo }               from '@/components/Logo';
import { OnboardingStepper }  from './OnboardingStepper';
import { SchoolDetailsStep }  from './steps/SchoolDetailsStep';
import { SchoolTypeStep }     from './steps/SchoolTypeStep';
import { BrandingStep }       from './steps/BrandingStep';
import { AcademicsStep }      from './steps/AcademicsStep';
import { AdministratorsStep } from './steps/AdministratorsStep';

const STEP_COMPONENTS = {
  1: SchoolDetailsStep,
  2: SchoolTypeStep,
  3: BrandingStep,
  4: AcademicsStep,
  5: AdministratorsStep,
} as const;

/**
 * Maps backend step names to wizard step numbers.
 * Used in the lazy useState initializer for page-refresh resume.
 */
const BACKEND_STEP_MAP: Record<string, number> = {
  school_info:        1,
  institution_info:   2,
  branding:           3,
  academic_settings:  4,
  administrators:     5,
};

export function OnboardingWizard() {
  const queryClient = useQueryClient();

  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser          = useAuthStore((s) => s.setUser);
  const setLogo          = useSchoolStore((s) => s.setLogo);
  const setSchoolName    = useSchoolStore((s) => s.setSchoolName);
  const clearDraft       = useOnboardingStore((s) => s.clearDraft);

  const {
    isLoading:     draftLoading,
    isReady:       draftReady,
    error:         draftError,
    draftWasReset,
  } = useInitializeDraft();

 
  const { mutate: submitSchoolInfo,       isPending: schoolInfoPending,  error: schoolInfoError }  = useSchoolInfo();
  const { mutate: submitInstitutionInfo,  isPending: institutionPending, error: institutionError } = useInstitutionInfo();
  const { mutate: submitAcademicSettings, isPending: academicPending,    error: academicError }    = useAcademicSettings();
  const { mutate: submitAdministrators,   isPending: adminPending,       error: adminError }       = useAdministrators();
  const { mutate: complete,               isPending: completePending,    error: completeError }    = useCompleteRegistration();

  
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name:                 '',
      contactEmail:         '',
      phone:                '',
      address:              '',
      city:                 '',
      state:                '',
      academicYear:         '',
      gradingSystem:        'letter',
      termStructure:        'two_semester',
      weekStart:            'monday',
      startTime:            '',
      endTime:              '',
      logoDataUrl:          null,
      logoPublicId:         null,
      adminFullName:        '',
      adminEmail:           '',
      adminPhone:           '',
      adminPassword:        '',
      adminConfirmPassword: '',
    },
    mode: 'onTouched',
  });

  
  const [step, setStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const state = useOnboardingStore.getState();
    if (
      state.draftToken &&
      !isDraftExpired(state.createdAt) &&
      state.currentStep
    ) {
      return BACKEND_STEP_MAP[state.currentStep] ?? 1;
    }
    return 1;
  });

  const [done, setDone] = useState(false);

  /* ── Clear stale logo when draft was reset ────────────────── */
  useEffect(() => {
    if (!draftWasReset) return;
    form.setValue('logoDataUrl',  null, { shouldDirty: false });
    form.setValue('logoPublicId', null, { shouldDirty: false });
  }, [draftWasReset, form]);

 
  const stepPending =
    schoolInfoPending || institutionPending || academicPending || adminPending || completePending;


  const isPending   = draftLoading || stepPending;
  const activeError =
    draftError || schoolInfoError || institutionError || academicError || adminError || completeError;

  /* ── Step navigation ──────────────────────────────────────── */
  async function handleContinue() {
    // Guard: do not submit before initialization is complete.
    // Relevant during the resume GET; effectively a no-op for fresh starts
    // because the init query resolves synchronously for the no-draft case.
    if (!draftReady) return;

    const stepFields = STEP_FIELD_MAP[step as keyof typeof STEP_FIELD_MAP] ?? [];
    const valid =
      stepFields.length === 0 ||
      (await form.trigger(stepFields as Parameters<typeof form.trigger>[0]));
    if (!valid) return;

    const values = form.getValues();

    if (step === 1) {
      /*
       * Step 1 — School information
       *
       * Field mapping (RHF form → backend contract):
       *   values.contactEmail → email
       *   values.state        → country: "Nigeria" (hardcoded per backend)
       *
       * On success, useSchoolInfo.onSuccess calls setDraft(token, step),
       * persisting the draft token before the wizard advances.
       */
      submitSchoolInfo(
        {
          name:    values.name,
          email:   values.contactEmail,
          phone:   values.phone,
          address: values.address,
          city:    values.city,
          country: 'Nigeria',
        },
        { onSuccess: () => setStep(2) },
      );
      return;
    }

    if (step === 2) {
      const institutionType =
        values.schoolType === 'college' || values.schoolType === 'district'
          ? 'private'
          : 'public';

      submitInstitutionInfo(
        {
          institutionType,
          educationalLevels: ['primary', 'secondary'],
        },
        { onSuccess: () => setStep(3) },
      );
      return;
    }

    if (step === 3) {
      // Branding is optional and handled inside BrandingStep.
      setStep(4);
      return;
    }

    if (step === 4) {
      const startYear = values.academicYear;
      const endYear = startYear ? String(Number(startYear) + 1) : '';
      const academicYear = startYear && endYear ? `${startYear}/${endYear}` : '';
      const schoolDays = [values.weekStart];

      submitAcademicSettings(
        {
          academicYear,
          gradingSystem: values.gradingSystem,
          termStructure: values.termStructure,
          weekStartsOn: values.weekStart,
          schoolDays,
          schoolStartTime: values.startTime,
          schoolEndTime: values.endTime,
        },
        { onSuccess: () => setStep(5) },
      );
      return;
    }

    // Step 5 — administrators → complete
    await form.handleSubmit(() => {
      submitAdministrators(
        {
          primaryFullName: values.adminFullName,
          primaryEmail:    values.adminEmail,
          primaryPhone:    values.adminPhone,
          primaryPassword: values.adminPassword,
        },
        {
          onSuccess: () => {
            complete(undefined, {
              onSuccess: (data) => {
                const token = (data as { token?: string; accessToken?: string }).token ?? (data as { token?: string; accessToken?: string }).accessToken;
                setAuthCookie(token, false);
                if (data.schoolId) setSchoolCookie(data.schoolId, false);
                setAuthenticated(true);
                setUser({
                  name:     values.adminFullName,
                  email:    values.adminEmail,
                  role:     'SCHOOL_ADMIN',
                  schoolId: data.schoolId,
                });
                if (values.logoDataUrl) setLogo(values.logoDataUrl);
                setSchoolName(values.name);
                clearDraft();
                queryClient.removeQueries({ queryKey: DRAFT_INIT_QUERY_KEY });
                setDone(true);
              },
            });
          },
        },
      );
    })();
  }

  /* ── Success screen ───────────────────────────────────────── */
  if (done) {
    const schoolName = form.getValues('name') || 'Your school';

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-elevated"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
          >
            <CheckIcon className="h-10 w-10" strokeWidth={3} />
          </motion.div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-slate-900">
            You&rsquo;re all set!
          </h1>
          <p className="mt-2 text-slate-500">
            {schoolName} is ready. Your workspace has been configured and you can start now.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-600">
            <SparklesIcon className="h-4 w-4" />
            14-day Enterprise trial activated
          </div>
          <Button
            size="xl"
            className="mt-8 w-full"
            rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            onClick={() => (window.location.href = '/dashboard')}
          >
            Go to dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

 
  const StepComponent = STEP_COMPONENTS[step as keyof typeof STEP_COMPONENTS];
  const stepLabel     = ONBOARDING_STEPS[step - 1].label;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Logo />
        <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Sign in instead
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:py-12">
        <OnboardingStepper currentStep={step} />

        <div className="flex-1">
          {activeError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {activeError instanceof Error
                ? activeError.message
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-sm font-semibold text-purple-600">
                  Step {step} of {ONBOARDING_STEPS.length}
                </p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                  {stepLabel}
                </h3>
                <div className="mt-6">
                  <FormProvider {...form}>
                    <StepComponent />
                  </FormProvider>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || isPending}
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                loading={isPending}
                onClick={handleContinue}
                rightIcon={
                  step === ONBOARDING_STEPS.length
                    ? <CheckIcon className="h-4 w-4" />
                    : <ArrowRightIcon className="h-4 w-4" />
                }
              >
                {step === ONBOARDING_STEPS.length ? 'Complete setup' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

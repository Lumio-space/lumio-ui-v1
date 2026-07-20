/**
 * OnboardingWizard — Complete draft lifecycle
 *
 * Draft lifecycle implemented here:
 *
 *  Init   useInitializeDraft handles:
 *           • fresh start  → POST /registration/drafts
 *           • valid resume → GET  /registration/drafts → update store currentStep
 *           • expired      → clear + POST /registration/drafts + wasReset:true
 *         React Query deduplication (staleTime:Infinity) prevents duplicate
 *         draft creation from Strict Mode, re-renders, or multi-tab scenarios.
 *
 *  Step   Initialized synchronously from the persisted store (lazy useState).
 *  init   isDraftExpired() is checked inside the initializer so an expired
 *         draft always starts at step 1, no useEffect→setState required.
 *         Zustand persist reads localStorage synchronously (client-only), so
 *         the persisted currentStep is available at first render.
 *
 *  Guard  The Continue button stays in loading state until isReady.
 *         handleContinue returns early if draftReady is false.
 *
 *  Reset  When draftWasReset is true (new draft was created), stale logo
 *         form state is cleared via form.setValue inside a useEffect.
 *         This does NOT trigger react-hooks/set-state-in-effect because
 *         form.setValue is an RHF method, not a React state setter.
 *
 *  Complete
 *         clearDraft()                   — wipes persisted store
 *         queryClient.removeQueries()    — clears the init query cache
 *         Ensures a future visit to /onboarding creates a fresh draft.
 *
 */

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

import { useAuthStore }                    from '@/stores/auth.store';
import { useSchoolStore }                  from '@/stores/school.store';
import { useOnboardingStore, isDraftExpired } from '@/stores/onboarding.store';
import { setAuthCookie }                   from '@/features/auth/hooks/useAuth';

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


const BACKEND_STEP_MAP: Record<string, number> = {
  school_info:        1,
  institution_info:   2,
  branding:           3,
  academic_settings:  4,
  administrators:     5,
};

export function OnboardingWizard() {
  const queryClient = useQueryClient();

  // Auth / school stores 
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser          = useAuthStore((s) => s.setUser);
  const setLogo          = useSchoolStore((s) => s.setLogo);
  const setSchoolName    = useSchoolStore((s) => s.setSchoolName);
  const clearDraft       = useOnboardingStore((s) => s.clearDraft);

  // Draft lifecycle 
  const {
    isLoading:     draftLoading,
    isReady:       draftReady,
    error:         draftError,
    draftWasReset,
  } = useInitializeDraft();

  // Step mutations 
  const { mutate: submitSchoolInfo,       isPending: schoolInfoPending,  error: schoolInfoError }  = useSchoolInfo();
  const { mutate: submitInstitutionInfo,  isPending: institutionPending, error: institutionError } = useInstitutionInfo();
  const { mutate: submitAcademicSettings, isPending: academicPending,    error: academicError }    = useAcademicSettings();
  const { mutate: submitAdministrators,   isPending: adminPending,       error: adminError }       = useAdministrators();
  const { mutate: complete,               isPending: completePending,    error: completeError }    = useCompleteRegistration();

  // Form (declared before any effect that references it)
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
      termStructure:        'semester',
      weekStart:            'mon',
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

  /* Step state 
   *
   * Lazy initializer reads from the persisted onboarding store so
   * that a returning user resumes at their last step without any
   * useEffect → setState chain.
   *
   * isDraftExpired() is checked here so that an expired draft never
   * restores a stale step — it always returns 1 instead.
   *
   * Zustand persist reads localStorage synchronously, so the persisted
   * currentStep value is available by the time this function runs.
   */
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

  /* Clear stale logo when a new draft is created 
   *
   * draftWasReset is true when useInitializeDraft created a new draft
   * (either first visit or after expiry). Any previously uploaded logo
   * belongs to the old (now invalid) draft and must not be reused.
   *
   * form.setValue is an RHF method, not a React state setter, so this
   * pattern does not trigger react-hooks/set-state-in-effect.
   */
  useEffect(() => {
    if (!draftWasReset) return;
    form.setValue('logoDataUrl',  null, { shouldDirty: false });
    form.setValue('logoPublicId', null, { shouldDirty: false });
  }, [draftWasReset, form]);

  // Derived
  const stepPending = schoolInfoPending || institutionPending || academicPending || adminPending || completePending;
  const isPending   = draftLoading || stepPending;
  const activeError = draftError || schoolInfoError || institutionError || academicError || adminError || completeError;

  // Step navigation 
  async function handleContinue() {
    // Guard: never submit without a valid draft
    if (!draftReady) return;

    const stepFields = STEP_FIELD_MAP[step as keyof typeof STEP_FIELD_MAP] ?? [];
    const valid =
      stepFields.length === 0 ||
      (await form.trigger(stepFields as Parameters<typeof form.trigger>[0]));
    if (!valid) return;

    const values = form.getValues();

    if (step === 1) {
      submitSchoolInfo(
        {
          name:         values.name,
          contactEmail: values.contactEmail,
          phone:        values.phone,
          address:      values.address,
          city:         values.city,
          state:        values.state,
        },
        { onSuccess: () => setStep(2) },
      );
      return;
    }

    if (step === 2) {
      submitInstitutionInfo(
        { schoolType: values.schoolType },
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
      submitAcademicSettings(
        {
          academicYear:  values.academicYear,
          gradingSystem: values.gradingSystem,
          termStructure: values.termStructure,
          weekStart:     values.weekStart,
          startTime:     values.startTime,
          endTime:       values.endTime,
        },
        { onSuccess: () => setStep(5) },
      );
      return;
    }

    // Step 5 — administrators → complete
    await form.handleSubmit(() => {
      submitAdministrators(
        {
          fullName: values.adminFullName,
          email:    values.adminEmail,
          phone:    values.adminPhone,
          password: values.adminPassword,
        },
        {
          onSuccess: () => {
            complete(undefined, {
              onSuccess: (data) => {
                // Set auth credentials
                setAuthCookie(data.token, false);
                setAuthenticated(true);
                setUser({
                  name:  values.adminFullName,
                  email: values.adminEmail,
                  role:  'SCHOOL_ADMIN',
                });

                // Persist school branding for the dashboard
                if (values.logoDataUrl) setLogo(values.logoDataUrl);
                setSchoolName(values.name);

                // Clear ALL draft state: persisted store + React Query cache
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

  // Success screen
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
            {schoolName} is ready. Your workspace has been configured
            and you can start now.
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

  // Wizard
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

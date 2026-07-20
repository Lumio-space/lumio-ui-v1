'use client';

import { useMutation }        from '@tanstack/react-query';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { createDraft }        from '../api/registration.api';


export function useCreateDraft() {
  const setDraft = useOnboardingStore((s) => s.setDraft);

  return useMutation({
    mutationFn: createDraft,
    onSuccess: (data) => {
      setDraft(data.draftToken, data.currentStep);
    },
  });
}

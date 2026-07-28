'use client';

import { useMutation }    from '@tanstack/react-query';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { saveSchoolInfo } from '../api/registration.api';

export function useSchoolInfo() {
  const setDraft = useOnboardingStore((state) => state.setDraft);

  return useMutation({
    mutationFn: saveSchoolInfo,
    onSuccess: (data) => {
      setDraft(data.draftToken, data.currentStep);
    },
  });
}

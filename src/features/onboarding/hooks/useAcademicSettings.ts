'use client';

import { useMutation }          from '@tanstack/react-query';
import { saveAcademicSettings } from '../api/registration.api';

export function useAcademicSettings() {
  return useMutation({ mutationFn: saveAcademicSettings });
}

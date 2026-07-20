'use client';

import { useMutation }        from '@tanstack/react-query';
import { saveInstitutionInfo } from '../api/registration.api';

export function useInstitutionInfo() {
  return useMutation({ mutationFn: saveInstitutionInfo });
}

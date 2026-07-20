'use client';

import { useMutation }    from '@tanstack/react-query';
import { saveSchoolInfo } from '../api/registration.api';

export function useSchoolInfo() {
  return useMutation({ mutationFn: saveSchoolInfo });
}

'use client';

import { useMutation }         from '@tanstack/react-query';
import { completeRegistration } from '../api/registration.api';


export function useCompleteRegistration() {
  return useMutation({ mutationFn: completeRegistration });
}

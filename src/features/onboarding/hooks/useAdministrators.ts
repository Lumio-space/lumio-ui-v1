'use client';

import { useMutation }       from '@tanstack/react-query';
import { saveAdministrators } from '../api/registration.api';

export function useAdministrators() {
  return useMutation({ mutationFn: saveAdministrators });
}

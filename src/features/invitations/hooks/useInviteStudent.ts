'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteStudent } from '../api/invitations.api';
import type { InviteStudentPayload } from '../types';

/**
 * Mutation hook to invite a student with email only.
 */
export function useInviteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteStudentPayload) => inviteStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

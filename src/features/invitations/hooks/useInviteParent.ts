'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteParent } from '../api/invitations.api';
import type { InviteParentPayload } from '../types';

/**
 * Mutation hook to invite a parent with email only.
 */
export function useInviteParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteParentPayload) => inviteParent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

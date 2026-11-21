export const parentQueryKeys = {
  all: ['parents'] as const,
  lists: () => [...parentQueryKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...parentQueryKeys.lists(), params ?? {}] as const,
  details: () => [...parentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...parentQueryKeys.details(), id] as const,
};

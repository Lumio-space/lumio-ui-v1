'use client';

/**
 * Parents Feature React Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { parentQueryKeys } from '../constants';
import { fetchParents, fetchParentById } from '../api/parents.api';
import type { FetchParentsParams } from '../types';

/**
 * Query hook to fetch parents with optional search and pagination.
 */
export function useParents(params?: FetchParentsParams) {
  return useQuery({
    queryKey: parentQueryKeys.list(params as Record<string, unknown>),
    queryFn: () => fetchParents(params),
  });
}

/**
 * Query hook to fetch a single parent by ID.
 */
export function useParent(parentId: string) {
  return useQuery({
    queryKey: parentQueryKeys.detail(parentId),
    queryFn: () => fetchParentById(parentId),
    enabled: Boolean(parentId),
  });
}

export * from './useParentChildren';


/**
 * Classes API
 *
 * Endpoints (from classes.controller.ts):
 *   GET  /classes/        → getClasses  (requires VIEW_CLASS permission)
 *   POST /classes/create  → createClass (requires CREATE_CLASS permission)
 *
 * Authentication is handled by the backend JWT + RBAC guards.
 * The shared apiClient handles error normalisation via the response
 * interceptor — callers receive plain Error objects with message strings.
 */

import { apiClient } from '@/lib/api/axios';
import type { ClassRecord, CreateClassPayload } from '../types';

export async function fetchClasses(): Promise<ClassRecord[]> {
  const response = await apiClient.get<ClassRecord[]>('/classes/');
  return response.data;
}

export async function createClass(payload: CreateClassPayload): Promise<ClassRecord> {
  const response = await apiClient.post<ClassRecord>('/classes/create', payload);
  return response.data;
}

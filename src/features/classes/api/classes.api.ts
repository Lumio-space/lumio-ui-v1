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

const LEGACY_GRADE_MAP: Record<string, string> = {
  kindergarten: 'nursery3',
  'Primary 1': 'Primary1',
  'Primary 2': 'Primary2',
  'Primary 3': 'Primary3',
  'Primary 4': 'Primary4',
  'Primary 5': 'Primary5',
  'Primary 6': 'Primary6',
  'JSS 1': 'JSS1',
  'JSS 2': 'JSS2',
  'JSS 3': 'JSS3',
  'SSS 1': 'SSS1',
  'SSS 2': 'SSS2',
  'SSS 3': 'SSS3',
};

export function normalizeGradeLevelForBackend(gradeLevel: string): string {
  return LEGACY_GRADE_MAP[gradeLevel] ?? gradeLevel;
}

export async function fetchClasses(): Promise<ClassRecord[]> {
  const response = await apiClient.get<ClassRecord[] | { data: ClassRecord[] }>('/classes/');
  const data = Array.isArray(response.data)
    ? response.data
    : (response.data as { data?: ClassRecord[] })?.data ?? [];
  return data;
}

export async function createClass(payload: CreateClassPayload): Promise<ClassRecord> {
  const isSeniorSecondary = payload.schoolLevel === 'senior_secondary';

  const cleanPayload: Record<string, unknown> = {
    schoolLevel: payload.schoolLevel,
    gradeLevel: normalizeGradeLevelForBackend(payload.gradeLevel),
    gradeSection: payload.gradeSection,
    room: payload.room,
    capacity: payload.capacity,
  };

  // Frontend bridge for backend class-validator @IsString() and PostgreSQL check constraint:
  // - Senior Secondary classes receive their selected department ('Science', 'Arts', 'Commercial')
  // - Nursery, Primary, and Junior Secondary classes send 'Nill' to satisfy backend validation
  cleanPayload.department = isSeniorSecondary && payload.department
    ? String(payload.department)
    : 'Nill';

  const response = await apiClient.post<ClassRecord>('/classes/create', cleanPayload);
  return response.data;
}

export async function deleteClass(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/classes/${id}`);
  return response.data;
}


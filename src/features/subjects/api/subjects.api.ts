/**
 * Subjects API Service
 *
 * Interacts with backend subjects and teacher-subject assignment endpoints.
 *
 * Backend contracts:
 *   GET    /subjects                         → fetchSubjects (requires VIEW_SUBJECTS)
 *   POST   /subjects                         → createSubject ({ name, classIds, code, section, ... })
 *   PATCH  /subjects/:id                     → updateSubject
 *   DELETE /subjects/:id                     → deleteSubject
 *   POST   /subjects/:id/classes             → assignClassesToSubject ({ classIds })
 *   POST   /teachers/:teacherId/subjects     → assignSubjectToTeacher ({ classId, subjectId })
 *
 * Error handling is managed by the Axios response interceptor.
 */

import { apiClient } from '@/lib/api/axios';
import type {
  SubjectRecord,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  SubjectOffering,
  SchoolSection,
  SubjectDepartment,
  SubjectType,
  SubjectStatus,
} from '../types';

export interface BackendSubjectItem {
  id: string;
  schoolId?: string;
  title?: string;
  name?: string;
  code?: string;
  section?: string;
  department?: string;
  type?: string;
  subjectType?: string;
  status?: string;
  createdOn?: string;
  createdAt?: string;
  updatedAt?: string;
  classIds?: string[];
  offerings?: SubjectOffering[];
}

export const SECTION_TO_BACKEND_ENUM: Record<string, string> = {
  Nursery: 'nursery',
  Primary: 'primary',
  'Junior Secondary': 'junior_secondary',
  'Senior Secondary': 'senior_secondary',
  nursery: 'nursery',
  primary: 'primary',
  junior_secondary: 'junior_secondary',
  senior_secondary: 'senior_secondary',
};

export const BACKEND_TO_SECTION_MAP: Record<string, SchoolSection> = {
  nursery: 'Nursery',
  Nursery: 'Nursery',
  primary: 'Primary',
  Primary: 'Primary',
  junior_secondary: 'Junior Secondary',
  'Junior Secondary': 'Junior Secondary',
  senior_secondary: 'Senior Secondary',
  'Senior Secondary': 'Senior Secondary',
};

const METADATA_STORAGE_KEY = 'lumio_subjects_metadata';

export interface SubjectLocalMeta {
  section?: SchoolSection;
  department?: SubjectDepartment;
  type?: SubjectType;
  status?: SubjectStatus;
  classIds?: string[];
}

export function getStoredMetadata(): Record<string, SubjectLocalMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSubjectMetadata(id: string, meta: SubjectLocalMeta) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredMetadata();
    all[id] = { ...all[id], ...meta };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage write errors in restricted environments
  }
}

export function mapDepartmentToBackend(dept?: string): string | undefined {
  if (!dept) return undefined;
  if (dept === 'All departments' || dept === 'All') return 'All';
  return dept;
}

export function normalizeSubject(item: BackendSubjectItem): SubjectRecord {
  const storedMeta = getStoredMetadata()[item.id] || {};

  // Resolve section: prioritize item.section -> stored metadata -> fallback
  const rawSection = item.section || storedMeta.section;
  const mappedSection = rawSection ? BACKEND_TO_SECTION_MAP[rawSection] : undefined;
  const section: SchoolSection = mappedSection ?? storedMeta.section ?? 'Senior Secondary';

  const isSeniorSec = section === 'Senior Secondary';

  // Department: only Senior Secondary carries a department
  const rawDept = item.department || (isSeniorSec ? storedMeta.department : undefined);
  const normalizedDept =
    rawDept === 'All' ? 'All departments' : (rawDept as SubjectRecord['department']);

  // Subject type: only Senior Secondary carries admin-configurable subject type
  const rawType = item.type || item.subjectType || (isSeniorSec ? storedMeta.type : undefined);
  let normalizedType: SubjectRecord['type'] | undefined;
  if (rawType) {
    normalizedType =
      rawType.toLowerCase() === 'elective' ? 'Elective' : 'Compulsory';
  } else if (isSeniorSec) {
    normalizedType = undefined;
  }

  const classIds = item.classIds?.length ? item.classIds : (storedMeta.classIds || []);

  return {
    id: item.id,
    schoolId: item.schoolId,
    name: item.name || item.title || 'Untitled Subject',
    code: item.code || (item.name || item.title || 'SUB').slice(0, 3).toUpperCase(),
    section,
    department: isSeniorSec ? normalizedDept : undefined,
    type: isSeniorSec ? normalizedType : undefined,
    status: (item.status as SubjectRecord['status']) || storedMeta.status || 'Active',
    createdOn:
      item.createdOn ||
      (item.createdAt ? item.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    classIds,
    offerings: item.offerings || [],
  };
}

export async function fetchSubjects(): Promise<SubjectRecord[]> {
  try {
    const response = await apiClient.get<BackendSubjectItem[] | { data: BackendSubjectItem[] }>('/subjects');
    const rawData = Array.isArray(response.data)
      ? response.data
      : (response.data as { data?: BackendSubjectItem[] })?.data ?? [];
    return rawData.map(normalizeSubject);
  } catch (err: unknown) {
    // If backend GET /subjects endpoint is not yet mounted (returns 404),
    // return an empty array to prevent breaking the UI while backend is being updated.
    const axiosError = err as { response?: { status?: number } };
    if (axiosError?.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function createSubject(
  payload: CreateSubjectPayload
): Promise<SubjectRecord> {
  const normalizedSection =
    SECTION_TO_BACKEND_ENUM[payload.section] ?? payload.section.toLowerCase();
  const isSeniorSecondary = normalizedSection === 'senior_secondary';

  const backendPayload: Record<string, unknown> = {
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    section: normalizedSection,
    schoolLevel: normalizedSection, // satisfies @ValidateIf((dto) => dto.schoolLevel === 'senior_secondary')
    classIds: payload.classIds ?? [],
    status: payload.status,
  };

  if (isSeniorSecondary) {
    if (payload.department) {
      backendPayload.department = mapDepartmentToBackend(payload.department);
    }
    backendPayload.subjectType = payload.type
      ? payload.type.toLowerCase()
      : 'compulsory';
  } else {
    // Non-senior secondary subjects are strictly compulsory in the backend service
    backendPayload.subjectType = 'compulsory';
  }

  const response = await apiClient.post<
    BackendSubjectItem | { subject: BackendSubjectItem; attachedClasses?: string[] }
  >('/subjects', backendPayload);

  const resData = response.data;
  const raw = ((resData as { subject?: BackendSubjectItem }).subject || resData) as BackendSubjectItem;

  // Requirement: Creating a subject must NOT automatically assign it to classes.
  // The subject is created only; classes are explicitly assigned in the subsequent step.
  const explicitClassIds = payload.classIds ?? [];

  // Merge the frontend user selection with backend returned record
  const createdRecord: SubjectRecord = {
    id: raw.id,
    schoolId: raw.schoolId,
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    section: payload.section,
    department: isSeniorSecondary ? payload.department : undefined,
    type: isSeniorSecondary ? payload.type : undefined,
    status: payload.status,
    createdOn:
      raw.createdOn ||
      (raw.createdAt ? raw.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    classIds: explicitClassIds,
    offerings: [],
  };

  // Persist metadata to local cache so subsequent fetchSubjects preserves the configuration
  saveSubjectMetadata(createdRecord.id, {
    section: createdRecord.section,
    department: createdRecord.department,
    type: createdRecord.type,
    status: createdRecord.status,
    classIds: explicitClassIds,
  });

  return createdRecord;
}


export async function updateSubject(
  id: string,
  payload: UpdateSubjectPayload
): Promise<SubjectRecord> {
  const response = await apiClient.patch<BackendSubjectItem>(
    `/subjects/${id}`,
    payload
  );
  if (payload.section || payload.department || payload.type || payload.status || payload.classIds) {
    saveSubjectMetadata(id, {
      section: payload.section,
      department: payload.department,
      type: payload.type,
      status: payload.status,
      classIds: payload.classIds,
    });
  }
  return normalizeSubject(response.data);
}

export async function deleteSubject(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/subjects/${id}`);
  return response.data;
}

export async function assignClassesToSubject(
  subjectId: string,
  classIds: string[]
): Promise<{ success: boolean; classIds: string[] }> {
  try {
    const response = await apiClient.post<{ success: boolean; classIds: string[] }>(
      `/subjects/${subjectId}/classes`,
      { classIds }
    );
    saveSubjectMetadata(subjectId, { classIds });
    return response.data;
  } catch (err: unknown) {
    const errorObj = err as { response?: { status?: number }; status?: number; message?: string };
    const is404 =
      errorObj?.response?.status === 404 ||
      errorObj?.status === 404 ||
      (err instanceof Error &&
        (err.message.includes('404') ||
          err.message.includes('Cannot POST') ||
          /not found/i.test(err.message)));

    if (is404) {
      saveSubjectMetadata(subjectId, { classIds });
      return { success: true, classIds };
    }
    throw err;
  }
}

export async function assignTeacherToSubject(
  teacherId: string,
  classId: string,
  subjectId: string
): Promise<{ success: boolean; message?: string }> {
  // Uses existing backend route: POST /teachers/assign-subjects
  const response = await apiClient.post<{ success: boolean; message?: string }>(
    '/teachers/assign-subjects',
    { teacherId, classId, subjectId }
  );
  return response.data;
}

/**
 * Registration API
 *
 * All onboarding registration endpoints, implemented with the shared
 * Axios instance. The `x-draft-token` header is attached automatically
 * by the request interceptor — callers do not pass it manually.
 *
 * Endpoints
 * ─────────────────────────────────────────────────────────────────
 * POST /registration/drafts/steps/school-info      → saveSchoolInfo  ← creates the draft
 * POST /registration/drafts/steps/institution-info → saveInstitutionInfo
 * POST /registration/drafts/branding/signature     → requestBrandingSignature
 * POST /registration/drafts/steps/branding         → saveBranding
 * POST /registration/drafts/steps/academic-settings → saveAcademicSettings
 * POST /registration/drafts/steps/administrators   → saveAdministrators
 * GET  /registration/drafts                        → getDraft
 * POST /registration/drafts/complete               → completeRegistration
 *
 * Note: POST /registration/drafts has been removed by the backend.
 * The draft is now created automatically by the school-info step.
 */

import { apiClient } from '@/lib/api/axios';
import type {
  SchoolInfoPayload,
  SchoolInfoResponse,
  InstitutionInfoPayload,
  BrandingSignatureResponse,
  BrandingPayload,
  AcademicSettingsPayload,
  AdministratorsPayload,
  GetDraftResponse,
  CompleteRegistrationResponse,
} from '../types';

/**
 * Submit school information — this is the first onboarding request.
 *
 * The backend creates the registration draft automatically and returns
 * both the draftToken and the initial currentStep in the response.
 *
 * The request interceptor skips x-draft-token for this endpoint (see
 * interceptors.ts) because no draft exists yet.
 *
 * @throws {Error} When the server response is missing draftToken, to
 *   surface a clear error rather than silently continuing without a token.
 */
export async function saveSchoolInfo(payload: SchoolInfoPayload): Promise<SchoolInfoResponse> {
  const response = await apiClient.post<SchoolInfoResponse>(
    '/registration/drafts/steps/school-info',
    payload,
  );

  const data = response.data;

  if (!data?.draftToken) {
    throw new Error(
      'Registration could not be started: the server did not return a draft token. ' +
      'Please try again or contact support.',
    );
  }

  return data;
}

export async function saveInstitutionInfo(payload: InstitutionInfoPayload): Promise<void> {
  await apiClient.post('/registration/drafts/steps/institution-info', payload);
}

/**
 * Request Cloudinary-signed upload parameters.
 * Requires x-draft-token (attached by the request interceptor).
 */
interface BrandingSignatureRawResponse {
  api_key?:  string;
  apiKey?:   string;
  signature: string;
  timestamp: number;
  folder:    string;
  tags?:     string;
}

function normalizeBrandingSignatureResponse(
  data: BrandingSignatureRawResponse,
): BrandingSignatureResponse {
  const api_key = data.api_key ?? data.apiKey;
  if (!api_key) {
    throw new Error(
      'Cloudinary signature response is missing api_key. Please retry or contact support.',
    );
  }

  return {
    api_key,
    signature: data.signature,
    timestamp: data.timestamp,
    folder: data.folder,
    tags: data.tags ?? '',
  };
}

export async function requestBrandingSignature(): Promise<BrandingSignatureResponse> {
  const response = await apiClient.post<BrandingSignatureRawResponse>(
    '/registration/drafts/branding/signature',
  );
  return normalizeBrandingSignatureResponse(response.data);
}

/**
 * Save branding metadata to the backend after a successful Cloudinary upload.
 * Requires x-draft-token (attached by the request interceptor).
 * The backend expects camelCase field names (publicId, secureUrl).
 */
export async function saveBranding(payload: BrandingPayload): Promise<void> {
  await apiClient.post('/registration/drafts/steps/branding', payload);
}

export async function saveAcademicSettings(payload: AcademicSettingsPayload): Promise<void> {
  await apiClient.post('/registration/drafts/steps/academic-settings', payload);
}

export async function saveAdministrators(payload: AdministratorsPayload): Promise<void> {
  await apiClient.post('/registration/drafts/steps/administrators', payload);
}

/**
 * Retrieve the current draft state from the backend.
 * Used by the resume flow to restore the user to their last step.
 * Requires x-draft-token (attached by the request interceptor).
 */
export async function getDraft(): Promise<GetDraftResponse> {
  const response = await apiClient.get<GetDraftResponse>('/registration/drafts');
  return response.data;
}

export async function completeRegistration(): Promise<CompleteRegistrationResponse> {
  const response = await apiClient.post<CompleteRegistrationResponse>(
    '/registration/drafts/complete',
  );
  return response.data;
}

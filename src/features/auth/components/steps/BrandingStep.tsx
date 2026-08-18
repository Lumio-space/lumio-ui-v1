'use client';

/**
 * BrandingStep — Step 3 of the onboarding wizard.
 *
 * Responsibilities
 * ─────────────────
 * • Render the generic ImageUpload component wired to the branding upload flow.
 * • Bridge between React Hook Form state (logoDataUrl, logoPublicId) and the
 *   ImageUpload controlled interface (value / onChange / onUpload).
 * • Show the domain-specific sidebar preview below the upload zone.
 *
 * The upload logic itself lives in:
 *   features/onboarding/hooks/useBranding.ts   — React Query mutation
 *   features/onboarding/services/logo.upload.ts — orchestration
 *   features/onboarding/services/logo.cloudinary.ts — Cloudinary upload
 */

import { useFormContext, useWatch } from 'react-hook-form';
import { ImageIcon }                from 'lucide-react';
import { ImageUpload }              from '@/components/shared/ImageUpload';
import { useBranding }              from '@/features/onboarding/hooks/useBranding';
import { LOGO_MAX_LABEL }           from '@/features/onboarding/services/logo.validation';
import type { UploadedImageMetadata } from '@/services/cloudinary';

export function BrandingStep() {
  const { control, setValue, clearErrors, formState } = useFormContext();

  // RHF persists the Cloudinary URL across AnimatePresence unmount/remount.
  const logoDataUrl = useWatch({ control, name: 'logoDataUrl' }) as string | null;

  const { mutateAsync: uploadLogo } = useBranding();

  const logoError = formState.errors?.logoDataUrl;

  /**
   * Bridge: useBranding returns snake_case LogoMetadata (Cloudinary convention).
   * ImageUpload expects camelCase UploadedImageMetadata (frontend convention).
   */
  async function handleUpload(file: File): Promise<UploadedImageMetadata> {
    const meta = await uploadLogo(file);
    return {
      publicId:  meta.public_id,
      secureUrl: meta.secure_url,
      width:     meta.width,
      height:    meta.height,
      format:    meta.format,
    };
  }

  /** Commit upload result or removal into RHF state. */
  function handleChange(metadata: UploadedImageMetadata | null) {
    if (metadata) {
      clearErrors('logoDataUrl');
      setValue('logoDataUrl', metadata.secureUrl, {
        shouldDirty:    true,
        shouldTouch:    true,
        shouldValidate: false,
      });
      setValue('logoPublicId', metadata.publicId, { shouldDirty: true });
    } else {
      setValue('logoDataUrl',  null, { shouldDirty: true });
      setValue('logoPublicId', null, { shouldDirty: true });
      clearErrors('logoDataUrl');
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Upload your school logo. It will appear in the sidebar and across your
        workspace. This step is optional — you can update it later in Settings.
      </p>

      <ImageUpload
        onUpload={handleUpload}
        value={logoDataUrl}
        onChange={handleChange}
        error={logoError ? String(logoError.message) : undefined}
        validation={{ maxLabel: LOGO_MAX_LABEL }}
      />

      {/* ── Sidebar preview — domain-specific, not part of ImageUpload ── */}
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Sidebar preview
        </p>

        <div className="flex items-center gap-3 rounded-xl bg-indigo-900 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-800/60 ring-1 ring-inset ring-indigo-700/50">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt="School logo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-indigo-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Your School Name
            </p>
            <p className="text-xs text-indigo-300">Administrator workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}

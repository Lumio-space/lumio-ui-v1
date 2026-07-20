'use client'


import React, { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { UploadCloudIcon, ImageIcon, XIcon, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateLogoFile, LOGO_MAX_LABEL } from '@/features/onboarding/services/logo.validation'
import { useBranding }                      from '@/features/onboarding/hooks/useBranding'

export function BrandingStep() {
  const { control, setValue, setError, clearErrors, formState } =
    useFormContext()

  // RHF state — persisted across AnimatePresence unmount/remount
  const logoDataUrl = useWatch({ control, name: 'logoDataUrl' })

  // Local UI state — reset on remount (only needed while the step is mounted)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)

  const { mutate: uploadLogo, isPending: isUploading } = useBranding()

  // Which URL to show:
  //   • During upload:  local data URL (immediate feedback via FileReader)
  //   • After upload:   Cloudinary secure_url (from RHF)
  //   • After remount:  Cloudinary secure_url restored from RHF (local state gone)
  const displayUrl = previewDataUrl ?? logoDataUrl ?? null
  const hasLogo    = Boolean(displayUrl)
  const logoError  = formState.errors?.logoDataUrl

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset so re-selecting the same file re-triggers onChange
    e.target.value = ''

    // Client-side validation (mirrors backend rules)
    const validation = validateLogoFile(file)
    if (!validation.valid) {
      setError('logoDataUrl', { message: validation.message })
      return
    }

    clearErrors('logoDataUrl')

    // Immediate preview via FileReader — shown while the upload is in flight
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    uploadLogo(file, {
      onSuccess: (metadata) => {
        // Commit the Cloudinary URL and public_id to form state
        setValue('logoDataUrl', metadata.secure_url, {
          shouldDirty:    true,
          shouldTouch:    true,
          shouldValidate: false,
        })
        setValue('logoPublicId', metadata.public_id, {
          shouldDirty: true,
        })
        // Drop the local preview — the Cloudinary URL is now in RHF
        setPreviewDataUrl(null)
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        setError('logoDataUrl', { message })
        setPreviewDataUrl(null)
      },
    })
  }

  function handleRemove() {
    setValue('logoDataUrl',  null, { shouldDirty: true })
    setValue('logoPublicId', null, { shouldDirty: true })
    setPreviewDataUrl(null)
    clearErrors('logoDataUrl')
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Upload your school logo. It will appear in the sidebar and across your
        workspace. This step is optional — you can update it later in Settings.
      </p>

      {/* Upload area */}
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          hasLogo
            ? 'border-purple-300 bg-purple-50/40'
            : 'border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/40',
          logoError  && 'border-red-300 bg-red-50/40',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        {isUploading ? (
          <Loader2Icon className="h-10 w-10 animate-spin text-purple-400" />
        ) : (
          <UploadCloudIcon
            className={cn(
              'h-10 w-10',
              hasLogo
                ? 'text-purple-400'
                : logoError
                  ? 'text-red-400'
                  : 'text-slate-400',
            )}
          />
        )}

        <span className="mt-3 text-sm font-semibold text-slate-700">
          {isUploading
            ? 'Uploading…'
            : hasLogo
              ? 'Click to replace logo'
              : 'Click to upload or drag and drop'}
        </span>
        <span className="mt-1 text-xs text-slate-400">
          PNG, JPG, SVG or WebP — max {LOGO_MAX_LABEL}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          aria-label="Upload school logo"
        />
      </label>

      {/* Validation / upload error */}
      {logoError && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {String(logoError.message)}
        </p>
      )}

      {/* Sidebar preview */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sidebar preview
          </p>
          {hasLogo && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              <XIcon className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-indigo-900 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-800/60 ring-1 ring-inset ring-indigo-700/50">
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
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
  )
}

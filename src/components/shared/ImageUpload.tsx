'use client';

/**
 * ImageUpload
 *
 * A fully-contained, reusable image-upload widget usable in any feature:
 * school logo, student avatars, teacher avatars, gallery images, etc.
 *
 * Features
 * ─────────
 * • Click-to-upload  (hidden file input, keyboard accessible)
 * • Drag-and-drop
 * • Immediate local preview via FileReader (while upload is in flight)
 * • Committed preview after a successful upload (shows value prop)
 * • Spinner during upload
 * • Inline error with Retry action
 * • Remove / clear image
 * • Configurable validation (MIME type, extension, max size)
 * • External error prop (e.g. from React Hook Form formState.errors)
 *
 * Design contract
 * ───────────────
 * The component is *controlled*:
 *   • `value`    — the committed URL managed by the parent (RHF / local state)
 *   • `onChange` — called with UploadedImageMetadata on success or null on remove
 *   • `onUpload` — injected upload function; the component is endpoint-agnostic
 *
 * State flow
 * ──────────
 * 1. User selects / drops a file → client validation runs.
 * 2. Pass → FileReader generates a local data URL for an immediate preview.
 * 3. `onUpload(file)` is awaited; spinner replaces icon.
 * 4a. Success → onChange(metadata); parent updates value; local preview cleared.
 * 4b. Failure → error shown inline; local preview cleared; Retry button appears.
 * 5. Remove → onChange(null); parent clears value; component returns to idle.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Loader2Icon,
  UploadCloudIcon,
  XIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateImageFile,
  DEFAULT_IMAGE_VALIDATION,
  type UploadedImageMetadata,
  type ImageValidationConfig,
} from '@/services/cloudinary';

/* ── Props ─────────────────────────────────────────────────────── */

export interface ImageUploadProps {
  /**
   * Async function that accepts a File and resolves with UploadedImageMetadata.
   * Injected by the caller — the component never hard-codes an upload endpoint.
   */
  onUpload: (file: File) => Promise<UploadedImageMetadata>;

  /**
   * The committed image URL (e.g. Cloudinary secureUrl after upload).
   * Managed entirely by the parent / RHF form.
   */
  value?: string | null;

  /**
   * Called when an upload succeeds (with metadata) or the image is removed (null).
   * The parent is responsible for persisting the returned metadata.
   */
  onChange: (metadata: UploadedImageMetadata | null) => void;

  /** Partial override for validation. Defaults to 5 MB, PNG/JPG/SVG/WebP. */
  validation?: Partial<ImageValidationConfig>;

  /** `accept` attribute on the hidden file input. */
  accept?: string;

  /** External error message (e.g. from React Hook Form). */
  error?: string;

  /** Disables all interaction. */
  disabled?: boolean;

  /** Additional Tailwind classes for the outer wrapper div. */
  className?: string;
}

/* ── Component ─────────────────────────────────────────────────── */

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';

export function ImageUpload({
  onUpload,
  value,
  onChange,
  validation,
  accept = DEFAULT_ACCEPT,
  error: externalError,
  disabled = false,
  className,
}: ImageUploadProps) {
  const config: ImageValidationConfig = {
    ...DEFAULT_IMAGE_VALIDATION,
    ...validation,
    // Keep Set fields from the override; fall back to defaults when absent.
    allowedMimeTypes:
      validation?.allowedMimeTypes ?? DEFAULT_IMAGE_VALIDATION.allowedMimeTypes,
    allowedExtensions:
      validation?.allowedExtensions ?? DEFAULT_IMAGE_VALIDATION.allowedExtensions,
  };

  /* ── Local state ─────────────────────────────────────────────── */

  /** Data URL shown while the upload is in flight (FileReader). */
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  /** Error produced by validation or by the upload itself. */
  const [uploadError, setUploadError]       = useState<string | null>(null);
  const [isUploading, setIsUploading]       = useState(false);
  const [isDragging, setIsDragging]         = useState(false);
  /** Stored so the Retry button can re-attempt without re-selecting. */
  const [lastFile, setLastFile]             = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Derived ─────────────────────────────────────────────────── */

  // During upload: show local data URL.  After upload: show committed URL.
  const displayUrl  = previewDataUrl ?? value ?? null;
  const hasImage    = Boolean(displayUrl);
  // External errors (from the parent form) take precedence over internal ones.
  const activeError = externalError ?? uploadError ?? null;

  /* ── Upload orchestration ────────────────────────────────────── */

  const startUpload = useCallback(
    async (file: File) => {
      const result = validateImageFile(file, config);
      if (!result.valid) {
        setUploadError(result.message);
        return;
      }

      setUploadError(null);
      setLastFile(file);

      // Kick off FileReader for the immediate preview.
      const reader = new FileReader();
      reader.onload = () => setPreviewDataUrl(reader.result as string);
      reader.readAsDataURL(file);

      setIsUploading(true);
      try {
        const metadata = await onUpload(file);
        // Commit: hand off to parent, drop the local preview.
        onChange(metadata);
        setPreviewDataUrl(null);
        setLastFile(null);
      } catch (err) {
        setPreviewDataUrl(null);
        setUploadError(
          err instanceof Error
            ? err.message
            : 'Upload failed. Please try again.',
        );
      } finally {
        setIsUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onUpload, onChange, config.maxBytes],
  );

  /* ── Event handlers ──────────────────────────────────────────── */

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting the same file
    void startUpload(file);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPreviewDataUrl(null);
    setUploadError(null);
    setLastFile(null);
    onChange(null);
  }

  function handleRetry(e: React.MouseEvent) {
    e.stopPropagation();
    setUploadError(null);
    if (lastFile) {
      void startUpload(lastFile);
    } else {
      inputRef.current?.click();
    }
  }

  function handleZoneClick() {
    if (isUploading || disabled) return;
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleZoneClick();
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void startUpload(file);
  }

  /* ── Sub-label helper ────────────────────────────────────────── */

  function formatSubLabel() {
    const exts = [...config.allowedExtensions]
      .map((e) => e.toUpperCase())
      .join(', ');
    return `${exts} — max ${config.maxLabel}`;
  }

  /* ── Primary label helper ────────────────────────────────────── */

  function primaryLabel() {
    if (isUploading) return 'Uploading…';
    if (isDragging)  return 'Drop to upload';
    if (hasImage)    return 'Click or drag to replace';
    return 'Click to upload or drag and drop';
  }

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Drop zone ───────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label={hasImage ? 'Replace image' : 'Upload image'}
        aria-disabled={disabled || isUploading}
        onClick={handleZoneClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
          // Idle: no image
          !hasImage && !isDragging && !activeError &&
            'border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/40',
          // Idle: has image
          hasImage && !activeError &&
            'border-purple-300 bg-purple-50/40 hover:border-purple-400',
          // Dragging over
          isDragging  && 'border-purple-400 bg-purple-50/60',
          // Error state
          activeError && 'border-red-300 bg-red-50/40',
          // Disabled / uploading
          (isUploading || disabled) && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
          disabled={isUploading || disabled}
          tabIndex={-1}
          aria-label="Select image file"
        />

        {/* Image thumbnail preview */}
        {displayUrl && !isUploading && (
          <div className="mb-3 h-20 w-20 overflow-hidden rounded-xl ring-2 ring-purple-200 ring-offset-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Uploaded image preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Spinner during upload */}
        {isUploading && (
          <Loader2Icon className="h-10 w-10 animate-spin text-purple-400" />
        )}

        {/* Upload icon when no image and not uploading */}
        {!displayUrl && !isUploading && (
          <UploadCloudIcon
            className={cn(
              'h-10 w-10',
              isDragging
                ? 'text-purple-500'
                : activeError
                  ? 'text-red-400'
                  : 'text-slate-400',
            )}
          />
        )}

        <span className="mt-3 text-sm font-semibold text-slate-700">
          {primaryLabel()}
        </span>
        <span className="mt-1 text-xs text-slate-400">
          {formatSubLabel()}
        </span>
      </div>

      {/* ── Error row ────────────────────────────────────────────── */}
      {activeError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="flex-1 text-xs font-medium text-red-700">
            {activeError}
          </p>
          {!isUploading && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
              aria-label="Retry upload"
            >
              <RefreshCwIcon className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Remove button ────────────────────────────────────────── */}
      {hasImage && !isUploading && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove image"
          >
            <XIcon className="h-3 w-3" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

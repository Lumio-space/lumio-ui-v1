/**
 * Application Constants
 *
 * Replaces scattered magic strings throughout the codebase.
 * All environment-dependent values come from process.env
 * and are validated at startup — never hardcoded here.
 */

export const APP_NAME = 'Lumio';
export const APP_TAGLINE = 'The operating system for modern schools.';
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Cookie / storage keys */
export const AUTH_TOKEN_KEY  = 'token';
export const AUTH_ROLE_KEY   = 'lumio-auth';

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

/** Avatar fallback */
export const AVATAR_CDN = 'https://i.pravatar.cc/160';

/** Notification polling interval (ms) */
export const NOTIFICATION_POLL_INTERVAL = 30_000;

/** TanStack Query defaults */
export const QUERY_STALE_TIME  = 60_000;   // 1 minute
export const QUERY_CACHE_TIME  = 300_000;  // 5 minutes

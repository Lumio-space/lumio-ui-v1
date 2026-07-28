import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// Create the shared Axios instance used across the app.
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Runtime debug: log the resolved baseURL in the browser so we can
// quickly detect misconfigured or missing `NEXT_PUBLIC_API_URL`.
if (typeof window !== 'undefined') {
  // Use console.info so it appears in the browser console during dev.
  console.info(
    '[apiClient] baseURL:',
    API_URL || '(empty) — set NEXT_PUBLIC_API_URL in .env.local',
  );
}

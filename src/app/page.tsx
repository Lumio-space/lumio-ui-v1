/**
 * Root page — redirects to /login.
 *
 * Next.js redirect() in a Server Component throws a NEXT_REDIRECT
 * which is caught by the framework — no try/catch needed.
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}

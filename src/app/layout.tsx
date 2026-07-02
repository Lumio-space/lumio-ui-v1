/**
 * Root Layout
 *
 * The single HTML shell for the entire app.
 * Providers are composed here so every page has access to:
 *   - TanStack Query (server state)
 *   - AuthProvider (role + session)
 *
 * Fonts are loaded via Google Fonts in index.css (no next/font here
 * because the brand spec requires Plus Jakarta Sans + Inter from CDN).
 */

import type { Metadata } from 'next';
import { Providers } from '@/providers';
import '@/index.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Lumio',
    default:  'Lumio — School Management System',
  },
  description: 'The operating system for modern schools. Run admissions, attendance, academics and communication from a single premium platform.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

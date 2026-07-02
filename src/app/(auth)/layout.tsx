/**
 * Auth Group Layout — (auth)
 *
 * Wraps /login and /onboarding. No sidebar or topbar here —
 * just a full-screen canvas background.
 * Route group (auth) does NOT add "auth" to the URL.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      {children}
    </div>
  );
}

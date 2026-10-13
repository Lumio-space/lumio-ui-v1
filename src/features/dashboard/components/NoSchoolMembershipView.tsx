'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCapIcon, ArrowRightIcon, LogOutIcon, KeyRoundIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import { clearAuthCookie } from '@/features/auth/hooks/useAuth';
import { logoutUser } from '@/features/auth/services/auth.api';

export function NoSchoolMembershipView() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;

    // Handle full URL or plain token
    if (trimmed.includes('token=')) {
      const parsedToken = trimmed.split('token=')[1]?.split('&')[0];
      if (parsedToken) {
        router.push(`/accept-invite?token=${encodeURIComponent(parsedToken)}`);
        return;
      }
    }
    router.push(`/accept-invite?token=${encodeURIComponent(trimmed)}`);
  }

  async function handleLogout() {
    clearAuthCookie();
    clearUser();
    setAuthenticated(false);
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during sign out
    }
    router.push('/login');
  }

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xs sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
          <GraduationCapIcon className="h-8 w-8" />
        </div>

        <h2 className="mt-5 font-display text-2xl font-extrabold text-slate-900">
          No Active School Membership
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Hello <span className="font-semibold text-slate-700">{user?.name || user?.email || 'there'}</span>.
          Your Lumio account is active, but you are not currently attached to any school workspace.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <KeyRoundIcon className="h-4 w-4 text-indigo-600" />
            Have an invitation token?
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            If your school administrator invited you, paste the invitation token or link below to join.
          </p>

          <form onSubmit={handleTokenSubmit} className="mt-3 flex gap-2">
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste invitation token or URL"
              className="h-10 text-sm bg-white"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!tokenInput.trim()}
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Continue
            </Button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOutIcon className="h-4 w-4" />}
            className="text-slate-500 hover:text-slate-700"
          >
            Sign out of this account
          </Button>
        </div>
      </div>
    </div>
  );
}

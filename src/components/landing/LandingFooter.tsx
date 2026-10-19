import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function LandingFooter() {
  return (
    <footer className="border-t border-indigo-950/20 bg-indigo-950 text-indigo-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Logo variant="light" />
            <p className="text-sm text-indigo-300/80 max-w-sm">
              The operating system for modern primary, secondary, and higher education
              institutions. Simplify administrative tasks, attendance, and academics.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Staff & Student Login
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-white transition-colors">
                  Register Your School
                </Link>
              </li>
              <li>
                <Link href="/accept-invite" className="hover:text-white transition-colors">
                  Accept Invitation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Legal & Support
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <span className="text-indigo-400/60">Privacy Policy</span>
              </li>
              <li>
                <span className="text-indigo-400/60">Terms of Service</span>
              </li>
              <li>
                <span className="text-indigo-400/60">Security & Compliance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-indigo-900/60 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-indigo-400">
          <p>© {new Date().getFullYear()} Lumio Education Inc. All rights reserved.</p>
          <p className="mt-4 sm:mt-0">Enterprise-grade School Management SaaS</p>
        </div>
      </div>
    </footer>
  );
}

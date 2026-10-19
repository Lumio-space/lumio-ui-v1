import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, LogInIcon } from 'lucide-react';

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-950/20 bg-indigo-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg">
          <Logo variant="light" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-indigo-200">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#attendance" className="hover:text-white transition-colors">
            Attendance
          </a>
          <a href="#teachers" className="hover:text-white transition-colors">
            Staff & Classes
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Security
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-indigo-200 hover:text-white hover:bg-indigo-900/50"
            size="sm"
          >
            <Link href="/login" className="flex items-center gap-1.5">
              <LogInIcon className="h-4 w-4" />
              <span>Sign in</span>
            </Link>
          </Button>

          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            size="sm"
          >
            <Link href="/onboarding" className="flex items-center gap-1.5">
              <span>Register school</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  CalendarCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-indigo-950 pt-12 pb-20 lg:pt-20 lg:pb-32 text-white">
      {/* Background dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Ambient gradient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-violet-500/20 to-gold-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline and Call-to-Actions */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-700/60 bg-indigo-900/60 px-3.5 py-1.5 text-xs sm:text-sm text-indigo-200 backdrop-blur-sm"
            >
              <SparklesIcon className="h-4 w-4 text-amber-400" />
              <span>Next-generation school management platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]"
            >
              The operating system for modern schools.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-indigo-200/90 leading-relaxed max-w-2xl"
            >
              Streamline attendance, effortlessly assign form teachers and subjects,
              and coordinate your entire faculty and student roster in one secure,
              seamless workspace.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <Button
                asChild
                size="xl"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25"
              >
                <Link href="/onboarding" className="flex items-center justify-center gap-2">
                  <span>Register your school</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="xl"
                className="border-indigo-700 bg-indigo-900/40 text-white hover:bg-indigo-800/60 hover:text-white"
              >
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <span>Sign in to portal</span>
                </Link>
              </Button>
            </motion.div>

            {/* Trust points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-indigo-800/60 pt-8 text-xs sm:text-sm text-indigo-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero setup fee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant teacher invites</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Role-based permissions</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive / Live Dashboard Mockup */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mx-auto max-w-md rounded-2xl border border-indigo-700/50 bg-indigo-900/40 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* Header card chip */}
              <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-800 text-amber-300 ring-1 ring-inset ring-indigo-700">
                    <GraduationCapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Oakridge Academy</h3>
                    <p className="text-xs text-indigo-300">2026/2027 Academic Session</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  Active
                </span>
              </div>

              {/* Attendance quick preview */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CalendarCheckIcon className="h-4 w-4 text-indigo-400" />
                    <span>Grade 10 - Blue Attendance</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">96.4% Present</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-950/60">
                  <div className="h-full w-[96.4%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>
              </div>

              {/* Mini Teacher & Subject Assignment Mock */}
              <div className="mt-6 rounded-xl border border-indigo-800/70 bg-indigo-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Staff Assignment
                  </span>
                  <span className="rounded bg-indigo-800/80 px-2 py-0.5 text-[10px] text-amber-300 font-medium">
                    Form Teacher
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-700/80 flex items-center justify-center font-bold text-xs text-white">
                    DR
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">Dr. Robert Chen</p>
                    <p className="text-[11px] text-indigo-300 truncate">Advanced Mathematics, Physics</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                    Assigned
                  </span>
                </div>
              </div>

              {/* Floating badges */}
              <div className="mt-5 flex items-center justify-between text-xs text-indigo-300 pt-2">
                <div className="flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4 text-indigo-400" />
                  <span>48 Faculty Members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-indigo-400" />
                  <span>FERPA & GDPR Compliant</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

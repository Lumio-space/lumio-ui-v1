

'use client';

import { motion } from 'framer-motion';
import { UsersIcon, BarChart3Icon, ShieldCheckIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';

const HIGHLIGHTS = [
  {
    icon:  UsersIcon,
    title: 'Unified school operations',
    desc:  'Students, staff, classes and parents in one workspace.',
  },
  {
    icon:  BarChart3Icon,
    title: 'Real-time analytics',
    desc:  'Attendance, performance and enrolment insights.',
  },
  {
    icon:  ShieldCheckIcon,
    title: 'Enterprise-grade security',
    desc:  'Role-based access, SSO and audit trails.',
  },
] as const;

export function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-900 p-12 lg:flex">
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize:  '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Logo variant="light" />
      </div>

      <div className="relative z-10 max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-extrabold leading-tight text-white"
        >
          The operating system for modern schools.
        </motion.h1>
        <p className="mt-4 text-lg text-indigo-200">
          Run admissions, attendance, academics and communication from a
          single premium platform.
        </p>

        <ul className="mt-10 space-y-5">
          {HIGHLIGHTS.map((h, i) => (
            <motion.li
              key={h.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-800 text-gold-300 ring-1 ring-inset ring-indigo-700">
                <h.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{h.title}</p>
                <p className="text-sm text-indigo-300">{h.desc}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-sm text-indigo-400">
        Trusted by 2,400+ schools across 36 states.
      </p>
    </div>
  );
}

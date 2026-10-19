import {
  CalendarCheckIcon,
  UsersIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  LayersIcon,
  SparklesIcon,
} from 'lucide-react';

const features = [
  {
    id: 'attendance',
    icon: CalendarCheckIcon,
    title: 'Precision Class Attendance',
    description:
      'Form teachers take roll in seconds with one-click toggles (Present, Late, Absent, Excused), instant percentage summaries, and tamper-proof historical logs.',
    badge: 'Form Teachers',
  },
  {
    id: 'teachers',
    icon: UsersIcon,
    title: 'Teacher Invitation & Assignment',
    description:
      'Zero-friction email invitations establish faculty membership first. Flexibly appoint form teachers to classes and allocate specialized subject courses with full visibility.',
    badge: 'Faculty Management',
  },
  {
    id: 'academics',
    icon: BookOpenIcon,
    title: 'Curriculum & Subjects',
    description:
      'Structure subject departments, link course syllabus offerings directly to class cohorts, and monitor staff subject load balancing across grade levels.',
    badge: 'Academics',
  },
  {
    id: 'security',
    icon: ShieldCheckIcon,
    title: 'Enterprise Security & RBAC',
    description:
      'Protect student confidentiality with multi-tenant data isolation, verified JWT credentials, role-based controls, and institutional audit trails.',
    badge: 'Compliance',
  },
];

export function FeatureHighlights() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Built for Modern Institutions</span>
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything your school needs to operate with excellence.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Lumio provides administrative leaders and teachers with modern, intuitive
            tools designed specifically for academic workflows.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-900 text-white shadow-sm">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-700">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-medium text-indigo-600">
                <LayersIcon className="h-3.5 w-3.5 mr-1.5" />
                <span>Integrated system</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

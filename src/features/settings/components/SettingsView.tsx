'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BuildingIcon,
  PaletteIcon,
  UploadCloudIcon,
  BellIcon,
  ShieldIcon,
  CheckIcon,
  InfoIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/shared/Tabs';
import { useSchoolStore } from '@/stores/school.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const brandColors = [
  { name: 'Deep Indigo', hex: '#312E81' },
  { name: 'Electric Purple', hex: '#8B5CF6' },
  { name: 'Soft Gold', hex: '#FBBF24' },
  { name: 'Emerald', hex: '#10B981' },
];

function ToggleSwitch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2',
        on ? 'bg-purple-600' : 'bg-slate-200'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          on ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export function SettingsView() {
  const schoolName = useSchoolStore((s) => s.schoolName) || 'Greenfield College';
  const logoDataUrl = useSchoolStore((s) => s.logoDataUrl);
  const user = useAuthStore((s) => s.user);

  const schoolInitials = useMemo(() => {
    return schoolName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [schoolName]);

  const [tab, setTab] = useState('school');
  const [brand, setBrand] = useState('#8B5CF6');
  const [logoName, setLogoName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Form field state
  const [name, setName] = useState(schoolName);
  const [email, setEmail] = useState(user?.email || 'admin@lumio.edu');
  const [phone, setPhone] = useState('+1 555 0100');
  const [address, setAddress] = useState('San Francisco, CA');
  const [academicYear, setAcademicYear] = useState('2026');
  const [timeZone, setTimeZone] = useState('wat');

  const [toggles, setToggles] = useState({
    email: true,
    push: true,
    weekly: false,
    security: true,
    twoFactor: false,
  });

  useEffect(() => {
    if (schoolName) setName(schoolName);
    if (user?.email) setEmail(user.email);
  }, [schoolName, user]);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs = [
    {
      id: 'school',
      label: 'School',
      icon: <BuildingIcon className="h-4 w-4" />,
    },
    {
      id: 'branding',
      label: 'Branding',
      icon: <PaletteIcon className="h-4 w-4" />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <BellIcon className="h-4 w-4" />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <ShieldIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your school profile, branding and preferences."
        actions={
          <Button
            leftIcon={saved ? <CheckIcon className="h-4 w-4" /> : undefined}
            variant={saved ? 'secondary' : 'default'}
            onClick={handleSave}
            disabled={tab === 'notifications'}
          >
            {saved ? 'Saved' : 'Save changes'}
          </Button>
        }
      />

      <Card className="border-slate-100 bg-white shadow-card">
        <div className="px-4 pt-2 sm:px-6">
          <Tabs active={tab} onChange={setTab} tabs={tabs} />
        </div>

        <div className="p-5 sm:p-6">
          {/* School Profile Tab */}
          {tab === 'school' && (
            <div className="max-w-2xl space-y-4">
              <div>
                <label
                  htmlFor="school-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  School name
                </label>
                <input
                  id="school-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Contact email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="school-address"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Address
                </label>
                <input
                  id="school-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="academic-year"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Academic year
                  </label>
                  <select
                    id="academic-year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    aria-label="Academic year"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="2026">2026 – 2027</option>
                    <option value="2025">2025 – 2026</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="time-zone"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Time zone
                  </label>
                  <select
                    id="time-zone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    aria-label="Time zone"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="wat">West Africa (WAT)</option>
                    <option value="gmt">Greenwich Mean Time (GMT)</option>
                    <option value="pst">Pacific Time (PST)</option>
                    <option value="est">Eastern Time (EST)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-900">
                <InfoIcon className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <p>
                  Core institutional properties are tied to your school&rsquo;s official registration. Contact support or use the administrative management endpoint to update formal legal details.
                </p>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {tab === 'branding' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  School logo
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-14 min-w-[140px] items-center justify-center rounded-xl bg-indigo-900 px-4 py-2 text-white font-display font-extrabold text-lg">
                    {logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoDataUrl}
                        alt={schoolName}
                        className="max-h-10 object-contain"
                      />
                    ) : (
                      <span>{schoolInitials}</span>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <UploadCloudIcon className="h-4 w-4 text-slate-500" />
                    <span>{logoName ?? 'Upload new logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setLogoName(e.target.files?.[0]?.name ?? 'logo.png')
                      }
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Recommended: transparent PNG or SVG, at least 400×120px.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Brand accent color
                </p>
                <div className="flex flex-wrap gap-3">
                  {brandColors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBrand(c.hex)}
                      aria-label={c.name}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all focus:outline-none',
                        brand === c.hex
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span
                        className="h-5 w-5 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Preview
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-xs"
                    style={{ backgroundColor: brand }}
                  >
                    Primary button
                  </button>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${brand}1a`,
                      color: brand,
                    }}
                  >
                    Active badge
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div className="max-w-2xl space-y-3">
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900"
              >
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                <p>
                  Local UI preferences only — notification settings are not saved to or synchronized with your account because the backend notification service is not yet implemented.
                </p>
              </div>
              {[
                {
                  key: 'email' as const,
                  title: 'Email notifications',
                  desc: 'Receive important updates by email.',
                },
                {
                  key: 'push' as const,
                  title: 'Push notifications',
                  desc: 'Get real-time alerts in the application.',
                },
                {
                  key: 'weekly' as const,
                  title: 'Weekly digest',
                  desc: 'A summary of school attendance and activity every Monday.',
                },
                {
                  key: 'security' as const,
                  title: 'Security alerts',
                  desc: 'Login attempts and administrative access changes.',
                },
              ].map((t) => (
                <div
                  key={t.key}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t.title}
                    </p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                  <ToggleSwitch
                    on={toggles[t.key]}
                    onChange={() =>
                      setToggles((s) => ({
                        ...s,
                        [t.key]: !s[t.key],
                      }))
                    }
                    label={t.title}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="max-w-2xl space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Two-factor authentication
                  </p>
                  <p className="text-xs text-slate-400">
                    Add an extra layer of security to your admin account.
                  </p>
                </div>
                <ToggleSwitch
                  on={toggles.twoFactor}
                  onChange={() =>
                    setToggles((s) => ({
                      ...s,
                      twoFactor: !s.twoFactor,
                    }))
                  }
                  label="Two-factor authentication"
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

import type { Metadata } from 'next';
import { OnboardingWizard } from '@/features/auth/components/OnboardingWizard';

export const metadata: Metadata = { title: 'Set up your workspace' };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}

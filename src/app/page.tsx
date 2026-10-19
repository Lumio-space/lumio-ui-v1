import { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { ResumeDraftBanner } from '@/components/landing/ResumeDraftBanner';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureHighlights } from '@/components/landing/FeatureHighlights';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Lumio — The Operating System for Modern Schools',
  description:
    'Empower your school with automated attendance, seamless teacher assignments, academic scheduling, and institutional security.',
};

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-foreground">
      <ResumeDraftBanner />
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureHighlights />
      </main>
      <LandingFooter />
    </div>
  );
}

import type { Metadata } from 'next';
import { ResultsView } from '@/features/results';

export const metadata: Metadata = {
  title: 'Results',
  description: 'Academic results, grade entry, publishing, and scratch cards',
};

export default function ResultsPage() {
  return <ResultsView />;
}

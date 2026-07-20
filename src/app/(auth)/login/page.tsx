import type { Metadata } from 'next';
import { BrandPanel }  from '@/features/auth/components/BrandPanel';
import { LoginForm }   from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}

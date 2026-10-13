'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InviteDetailsView } from './InviteDetailsView';
import { InviteSetupView } from './InviteSetupView';
import { InviteLoginView } from './InviteLoginView';

export interface AcceptInviteViewProps {
  initialStep?: 'details' | 'setup' | 'login';
}

export function AcceptInviteView({ initialStep }: AcceptInviteViewProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const queryStep = searchParams.get('step') as 'details' | 'setup' | 'login' | null;

  const [step, setStep] = useState<'details' | 'setup' | 'login'>(
    initialStep ?? queryStep ?? 'details'
  );

  if (step === 'setup') {
    return <InviteSetupView token={token} onBack={() => setStep('details')} />;
  }

  if (step === 'login') {
    return <InviteLoginView token={token} onBack={() => setStep('details')} />;
  }

  return (
    <InviteDetailsView
      token={token}
      onAccept={(isExisting) => {
        setStep(isExisting ? 'login' : 'setup');
      }}
    />
  );
}

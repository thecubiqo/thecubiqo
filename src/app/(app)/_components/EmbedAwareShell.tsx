'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from './AppShell';
import { CubiQoOverlays } from '@/next/components/overlays/CubiQoOverlays';

function ShellSwitch({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  // embed=1: the page is hosted inside the /app feature overlay iframe.
  // No shell chrome and no CubiQoOverlays — the host page mounts its own.
  if (params.get('embed') === '1') {
    return <div className="min-h-screen bg-neutral-950 text-slate-100">{children}</div>;
  }
  return (
    <AppShell>
      {children}
      <CubiQoOverlays />
    </AppShell>
  );
}

export function EmbedAwareShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <ShellSwitch>{children}</ShellSwitch>
    </Suspense>
  );
}

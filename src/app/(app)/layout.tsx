import { AppShell } from './_components/AppShell';
import { CubiQoOverlays } from '@/next/components/overlays/CubiQoOverlays';

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <CubiQoOverlays />
    </AppShell>
  );
}

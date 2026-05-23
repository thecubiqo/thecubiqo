import { AppShell } from './_components/AppShell';

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

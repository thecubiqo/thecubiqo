import { EmbedAwareShell } from './_components/EmbedAwareShell';

// AppShell + overlays normally; bare content when ?embed=1 (page hosted
// inside the /app feature overlay iframe — see frontend/src/App.js).
export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return <EmbedAwareShell>{children}</EmbedAwareShell>;
}

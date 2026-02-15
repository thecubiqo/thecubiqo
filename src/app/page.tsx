import { FullscreenApp } from "@/components/FullscreenApp";

// Force dynamic rendering to ensure auth state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default function Home() {
  return <FullscreenApp />;
}

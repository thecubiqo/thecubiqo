import { FullscreenApp } from '@/components/FullscreenApp'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Force-render FullscreenApp for now so the user can see the new design immediately
  return <FullscreenApp />
}

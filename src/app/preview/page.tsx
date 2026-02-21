'use client'

import dynamic from 'next/dynamic'

/**
 * /preview — public frontend preview route.
 *
 * Renders the full LandingPage experience without requiring
 * server-side auth or feature-flag evaluation. Useful for
 * quickly previewing the frontend UI in any environment.
 *
 * LandingPage uses @react-three/postprocessing (Bloom) which is
 * not SSR-safe, so we disable SSR here.
 */
const loadingEl = <div style={{ minHeight: '100vh', background: '#000' }} />

const LandingPage = dynamic(
  () => import('@/components/landing/LandingPage').then((m) => m.LandingPage),
  { ssr: false, loading: () => loadingEl }
)

export default function PreviewPage() {
  return <LandingPage showTopRightCTA={true} />
}

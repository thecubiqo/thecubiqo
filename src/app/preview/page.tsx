'use client'

import { LandingPage } from '@/components/landing/LandingPage'

/**
 * /preview — public frontend preview route.
 *
 * Renders the full LandingPage experience without requiring
 * server-side auth or feature-flag evaluation. Useful for
 * quickly previewing the frontend UI in any environment.
 */
export default function PreviewPage() {
  return <LandingPage showTopRightCTA={true} />
}

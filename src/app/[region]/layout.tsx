import { notFound } from 'next/navigation'
import { getWorldConfig, getAllWorlds, isValidWorld } from '@/lib/config/worlds'
import { WorldProvider } from '@/contexts/WorldContext'

/**
 * Unified World/Region Layout
 *
 * Handles routing for all worlds:
 * - Regional worlds: /uk, /in (geo-routing)
 * - Product worlds: /headlines, /vocspad
 *
 * Uses [region] param name for backward compatibility with existing links.
 */

interface WorldLayoutProps {
  children: React.ReactNode
  params: Promise<{ region: string }> // Named 'region' for backward compat
}

export default async function WorldLayout({
  children,
  params,
}: WorldLayoutProps) {
  const { region: worldId } = await params

  // Validate world ID
  if (!isValidWorld(worldId)) {
    notFound()
  }

  // Load world config
  const config = await getWorldConfig(worldId)

  if (!config) {
    notFound()
  }

  return (
    <WorldProvider config={config}>
      <div
        data-world={worldId}
        data-world-type={config.type}
        data-flavor={config.type === 'region' ? 'regional' : 'world'}
        className="min-h-screen bg-black"
      >
        {children}
      </div>
    </WorldProvider>
  )
}

// Generate static params for all worlds (regions + products)
export function generateStaticParams() {
  return getAllWorlds().map((region) => ({ region }))
}

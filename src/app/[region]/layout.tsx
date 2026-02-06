import { notFound } from 'next/navigation'
import { getRegionConfig } from '@/lib/config/regions'
import { RegionProvider } from '@/contexts/RegionContext'
import { getAllvalidRegin } from '../api/services/route'

// Valid region IDs - fetch at runtime, use fallback at build time
let VALID_REGIONS: string[] = []
try {
  VALID_REGIONS = await getAllvalidRegin()
} catch (err) {
  // Build time fallback
  VALID_REGIONS = ['global', 'us', 'uk', 'eu']
}


interface RegionalLayoutProps {
  children: React.ReactNode
  params: Promise<{ region: string }>
}

export default async function RegionalLayout({
  children,
  params,
}: RegionalLayoutProps) {
  const { region } = await params

  // Validate region
  if (!VALID_REGIONS.includes(region)) {
    notFound()
  }

  // Load region config
  const config = await getRegionConfig(region)

  if (!config) {
    notFound()
  }

  return (
    <RegionProvider config={config}>
      <div data-region={region} data-flavor="regional">
        {children}
      </div>
    </RegionProvider>
  )
}

// Generate static params for known regions
export function generateStaticParams() {
  return VALID_REGIONS.map((region: string) => ({ region }))
}

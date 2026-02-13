import { notFound } from 'next/navigation'
import { getRegionConfig } from '@/lib/config/regions'
import { RegionProvider } from '@/contexts/RegionContext'

// Valid region IDs - static list for build time
const VALID_REGIONS = ['uk']


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

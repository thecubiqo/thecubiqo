'use client'

import dynamic from 'next/dynamic'
import { Navigation } from '@/components/site/Navigation'
import { HeroSection } from '@/components/site/HeroSection'
import { DevicesSection } from '@/components/site/DevicesSection'
import { IntelligenceSection } from '@/components/site/IntelligenceSection'
import { VideoSection } from '@/components/site/VideoSection'
import { ContactSection } from '@/components/site/ContactSection'
import { MerchSection } from '@/components/site/MerchSection'
import { WorldsSection } from '@/components/site/WorldsSection'
import { CuboidsSection } from '@/components/site/CuboidsSection'
import { Footer } from '@/components/site/Footer'

export default function SitePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <DevicesSection />
        <IntelligenceSection />
        <VideoSection />
        <ContactSection />
        <MerchSection />
        <WorldsSection />
        <CuboidsSection />
      </main>
      <Footer />
    </>
  )
}

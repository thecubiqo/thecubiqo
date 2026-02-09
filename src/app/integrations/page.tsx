'use client'

import { AppLayout } from '@/components/AppLayout'

export default function IntegrationsPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Integrations</h1>
          <p className="text-white/60 mb-8">
            Connect CubiQo with your favorite services and tools.
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <p className="text-white/80">
              Third-party integrations coming soon...
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

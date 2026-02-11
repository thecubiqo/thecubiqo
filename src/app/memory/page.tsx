'use client'

import { AppLayout } from '@/components/AppLayout'

export default function MemoryPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Memory</h1>
          <p className="text-white/60 mb-8">
            Search and manage your AI memory across conversations.
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <p className="text-white/80">
              Memory management interface coming soon...
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import { AppLayout } from '@/components/AppLayout'

export default function IntegrationsPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Integrations</h1>
        <p className="text-gray-400 mb-8">
          Connect external services to extend CubiQo's capabilities.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Gmail', 'Calendar', 'Slack', 'Discord', 'GitHub', 'Notion'].map(service => (
            <div key={service} className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">{service}</h3>
              <p className="text-gray-400 mb-4">Coming soon</p>
              <button 
                disabled 
                className="bg-gray-700 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

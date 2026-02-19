'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import AgentDashboard from '@/components/AgentDashboard'
import AgentHub from '@/components/AgentHub'
import AgentUsePanel from '@/components/AgentUsePanel'
import AgentCreationModal from '@/components/AgentCreationModal'

export default function AgentsPage() {
  const [view, setView] = useState<'hub' | 'dashboard'>('hub')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleSelectAgent = (agentId: string, prompt?: string) => {
    setSelectedAgentId(agentId)
    setInitialPrompt(prompt)
  }

  const handleClosePanel = () => {
    setSelectedAgentId(null)
    setInitialPrompt(undefined)
  }

  return (
    <AppLayout>
      {/* View Toggle */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-3 flex items-center gap-2">
        <button
          onClick={() => setView('hub')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'hub'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🤖 Agent Hub
        </button>
        <button
          onClick={() => setView('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'dashboard'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📊 Dashboard
        </button>
      </div>

      {/* Views */}
      {view === 'hub' ? (
        <AgentHub
          onSelectAgent={handleSelectAgent}
          onCreateAgent={() => setShowCreateModal(true)}
          selectedAgentId={selectedAgentId}
        />
      ) : (
        <AgentDashboard />
      )}

      {/* Agent Use Panel (slide-out) */}
      {selectedAgentId && (
        <AgentUsePanel
          agentId={selectedAgentId}
          onClose={handleClosePanel}
          initialPrompt={initialPrompt}
        />
      )}

      {/* Agent Creation Modal */}
      <AgentCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </AppLayout>
  )
}

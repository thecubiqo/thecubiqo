'use client'

/**
 * IntegrationsSidePanel - Comprehensive panel showing available integrations
 * Categorically divided: Social Apps, Utility Apps, Business Apps, Job Hunt, Daily Journal, Codexo
 */

import { useState } from 'react'

const INTEGRATION_CATEGORIES = [
  {
    id: 'social-apps',
    name: 'Social Apps',
    icon: '💬',
    integrations: [
      { id: 'whatsapp', name: 'WhatsApp', icon: '💬', description: 'Messaging & voice calls', status: 'coming_soon' as const },
      { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Cloud-based messaging', status: 'available' as const },
      { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Photo & story sharing', status: 'coming_soon' as const },
      { id: 'x-twitter', name: 'X (Twitter)', icon: '𝕏', description: 'Microblogging & social', status: 'coming_soon' as const },
      { id: 'facebook', name: 'Facebook', icon: '👤', description: 'Social networking', status: 'coming_soon' as const },
      { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Professional networking', status: 'coming_soon' as const },
      { id: 'discord', name: 'Discord', icon: '🎮', description: 'Community & chat servers', status: 'coming_soon' as const },
      { id: 'slack', name: 'Slack', icon: '💼', description: 'Team communication', status: 'coming_soon' as const },
      { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Short-form video', status: 'coming_soon' as const },
      { id: 'snapchat', name: 'Snapchat', icon: '👻', description: 'Ephemeral messaging', status: 'coming_soon' as const },
      { id: 'signal-messenger', name: 'Signal', icon: '🔒', description: 'Encrypted messaging', status: 'coming_soon' as const },
      { id: 'cq-messenger', name: 'CQ Messenger', icon: '🟧', description: 'Built-in CubiQo messaging', status: 'available' as const },
    ],
  },
  {
    id: 'utility-apps',
    name: 'Utility Apps',
    icon: '🔧',
    integrations: [
      { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Email management', status: 'coming_soon' as const },
      { id: 'outlook', name: 'Outlook', icon: '📬', description: 'Email & calendar', status: 'coming_soon' as const },
      { id: 'google-calendar', name: 'Google Calendar', icon: '📅', description: 'Schedule & events', status: 'coming_soon' as const },
      { id: 'google-drive', name: 'Google Drive', icon: '📁', description: 'Cloud file storage', status: 'coming_soon' as const },
      { id: 'dropbox', name: 'Dropbox', icon: '📦', description: 'File sync & share', status: 'coming_soon' as const },
      { id: 'notion', name: 'Notion', icon: '📝', description: 'Notes & knowledge base', status: 'coming_soon' as const },
      { id: 'google-maps', name: 'Google Maps', icon: '🗺️', description: 'Maps & navigation', status: 'coming_soon' as const },
      { id: 'uber', name: 'Uber', icon: '🚕', description: 'Ride-hailing', status: 'coming_soon' as const },
      { id: 'doordash', name: 'DoorDash', icon: '🍔', description: 'Food delivery', status: 'coming_soon' as const },
      { id: 'spotify', name: 'Spotify', icon: '🎧', description: 'Music streaming', status: 'coming_soon' as const },
      { id: 'weather', name: 'Weather', icon: '🌤️', description: 'Forecasts & alerts', status: 'coming_soon' as const },
      { id: 'translate', name: 'Translate', icon: '🌐', description: 'Language translation', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'business-apps',
    name: 'Business Apps',
    icon: '🏢',
    integrations: [
      { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Payments & billing', status: 'coming_soon' as const },
      { id: 'shopify', name: 'Shopify', icon: '🛍️', description: 'E-commerce platform', status: 'coming_soon' as const },
      { id: 'quickbooks', name: 'QuickBooks', icon: '📊', description: 'Accounting & finance', status: 'coming_soon' as const },
      { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'CRM & sales', status: 'coming_soon' as const },
      { id: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'Marketing & CRM', status: 'coming_soon' as const },
      { id: 'zoom', name: 'Zoom', icon: '📹', description: 'Video conferencing', status: 'coming_soon' as const },
      { id: 'google-meet', name: 'Google Meet', icon: '🎥', description: 'Video meetings', status: 'coming_soon' as const },
      { id: 'docusign', name: 'DocuSign', icon: '✍️', description: 'E-signatures', status: 'coming_soon' as const },
      { id: 'printify', name: 'Printify', icon: '🖨️', description: 'Print-on-demand', status: 'coming_soon' as const },
      { id: 'printful', name: 'Printful', icon: '📦', description: 'Print & fulfillment', status: 'coming_soon' as const },
      { id: 'mailchimp', name: 'Mailchimp', icon: '📮', description: 'Email marketing', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'job-hunt',
    name: 'Job Hunt',
    icon: '🎯',
    integrations: [
      { id: 'linkedin-jobs', name: 'LinkedIn Jobs', icon: '💼', description: 'Job search & applications', status: 'available' as const },
      { id: 'indeed', name: 'Indeed', icon: '🔍', description: 'Job board aggregator', status: 'coming_soon' as const },
      { id: 'glassdoor', name: 'Glassdoor', icon: '🏢', description: 'Company reviews & salaries', status: 'coming_soon' as const },
      { id: 'resume-builder', name: 'Resume Builder', icon: '📄', description: 'AI-powered resume creation', status: 'available' as const },
      { id: 'interview-prep', name: 'Interview Prep', icon: '🎤', description: 'AI mock interviews', status: 'available' as const },
      { id: 'application-tracker', name: 'Application Tracker', icon: '📋', description: 'Track job applications', status: 'available' as const },
      { id: 'salary-insights', name: 'Salary Insights', icon: '💰', description: 'Market rate analysis', status: 'coming_soon' as const },
      { id: 'network-mapper', name: 'Network Mapper', icon: '🕸️', description: 'Professional connections', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    icon: '📔',
    integrations: [
      { id: 'mood-tracker', name: 'Mood Tracker', icon: '🎭', description: 'Daily emotional check-ins', status: 'available' as const },
      { id: 'voice-journal', name: 'Voice Journal', icon: '🎙️', description: 'Speak your thoughts', status: 'available' as const },
      { id: 'gratitude-log', name: 'Gratitude Log', icon: '🙏', description: 'Daily gratitude practice', status: 'available' as const },
      { id: 'goal-tracking', name: 'Goal Tracking', icon: '🎯', description: 'Set and track goals', status: 'available' as const },
      { id: 'habit-tracker', name: 'Habit Tracker', icon: '✅', description: 'Build daily habits', status: 'coming_soon' as const },
      { id: 'dream-journal', name: 'Dream Journal', icon: '🌙', description: 'Record and analyze dreams', status: 'coming_soon' as const },
      { id: 'health-log', name: 'Health Log', icon: '❤️', description: 'Track wellness & fitness', status: 'coming_soon' as const },
      { id: 'ai-insights', name: 'AI Insights', icon: '🧠', description: 'Pattern & trend analysis', status: 'available' as const },
    ],
  },
  {
    id: 'codexo',
    name: 'Codexo',
    icon: '💻',
    integrations: [
      { id: 'github', name: 'GitHub', icon: '🐙', description: 'Code repos & CI/CD', status: 'available' as const },
      { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deployment platform', status: 'available' as const },
      { id: 'vscode', name: 'VS Code', icon: '📘', description: 'Code editor integration', status: 'coming_soon' as const },
      { id: 'code-executor', name: 'Code Executor', icon: '▶️', description: 'Run code in-browser', status: 'available' as const },
      { id: 'terminal', name: 'Terminal', icon: '⌨️', description: 'Command-line access', status: 'available' as const },
      { id: 'ai-code-review', name: 'AI Code Review', icon: '🔍', description: 'Automated code analysis', status: 'available' as const },
      { id: 'docker', name: 'Docker', icon: '🐳', description: 'Container management', status: 'coming_soon' as const },
      { id: 'aws', name: 'AWS', icon: '☁️', description: 'Amazon Web Services', status: 'coming_soon' as const },
      { id: 'supabase', name: 'Supabase', icon: '⚡', description: 'Database & auth backend', status: 'available' as const },
      { id: 'figma', name: 'Figma', icon: '🎨', description: 'Design to code', status: 'coming_soon' as const },
    ],
  },
]

const STATUS_BADGES = {
  available: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  beta: { label: 'Beta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  coming_soon: { label: 'Coming Soon', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

interface IntegrationsSidePanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export function IntegrationsSidePanel({ isOpen, onClose, isDark = true }: IntegrationsSidePanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('social-apps')

  if (!isOpen) return null

  const totalAvailable = INTEGRATION_CATEGORIES.reduce(
    (sum, cat) => sum + cat.integrations.filter(i => i.status === 'available').length,
    0
  )
  const totalIntegrations = INTEGRATION_CATEGORIES.reduce(
    (sum, cat) => sum + cat.integrations.length,
    0
  )

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 left-0 h-full w-full sm:w-[420px] bg-zinc-900 border-r border-zinc-800 shadow-2xl z-[75] transform transition-transform duration-300 overflow-hidden flex flex-col"
        style={{ animation: 'slideInLeft 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <h2 className="text-lg font-semibold text-white">Integrations</h2>
                <p className="text-xs text-zinc-400">{totalAvailable} active · {totalIntegrations} total</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Bar */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-emerald-400 text-xl font-bold">{totalAvailable}</div>
              <div className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Active</div>
            </div>
            <div className="flex-1 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="text-zinc-300 text-xl font-bold">{totalIntegrations - totalAvailable}</div>
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Coming Soon</div>
            </div>
            <div className="flex-1 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="text-orange-400 text-xl font-bold">{INTEGRATION_CATEGORIES.length}</div>
              <div className="text-orange-400/70 text-[10px] uppercase tracking-wider">Categories</div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'thin' }}>
          {INTEGRATION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategory === category.id
            const availableCount = category.integrations.filter(i => i.status === 'available').length

            return (
              <div key={category.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{category.icon}</span>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{category.name}</div>
                      <div className="text-zinc-500 text-xs">{availableCount}/{category.integrations.length} active</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {availableCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Integrations */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-900/50">
                    {category.integrations.map((integration) => {
                      const badge = STATUS_BADGES[integration.status]
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">{integration.icon}</span>
                            <div>
                              <div className="text-white text-sm">{integration.name}</div>
                              <div className="text-zinc-500 text-xs">{integration.description}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
          <p className="text-center text-zinc-500 text-xs">
            BYO Mode: Use your own API keys for any integration
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

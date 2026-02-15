'use client'

import dynamic from 'next/dynamic'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const DevConsole = dynamic(
  () => import('@/components/dev-console/DevConsole'),
  { ssr: false }
)

export default function DevConsolePage() {
  const { isAdmin, isLoading, isAuthenticated } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Developer Console</h1>
          <p className="text-zinc-400">Please sign in to access the Developer Console.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400">You need admin privileges to access the Developer Console.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Developer Console</h1>
        <p className="text-zinc-400 text-sm">
          Use <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">Ctrl/Cmd+`</kbd> to
          toggle the floating console, or use the ⚡ button at the bottom-left.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-1">Prompt Pane</h3>
            <ul className="text-zinc-400 space-y-1 list-disc list-inside text-xs">
              <li>Quick single-line prompt</li>
              <li>Advanced multi-line prompt</li>
              <li>Prompt templates</li>
              <li>History with replay</li>
              <li>Apply response as code patch</li>
            </ul>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-1">Live Coder Pane</h3>
            <ul className="text-zinc-400 space-y-1 list-disc list-inside text-xs">
              <li>Monaco editor with TSX/TS/JSON</li>
              <li>File path input for quick creation</li>
              <li>TypeScript diagnostics</li>
              <li>Sandboxed live preview iframe</li>
              <li>CSP-restricted, no network access</li>
            </ul>
          </div>
        </div>
      </div>
      <DevConsole />
    </div>
  )
}

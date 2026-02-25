/**
 * FoundersPass Layout
 * Unified layout for founder-only features, experiments, and admin tools.
 * Consolidates navigation across /founderspass and /founders-pass sub-routes.
 */

import Link from 'next/link'

export default function FoundersPassLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center gap-6 text-sm">
        <Link href="/founderspass" className="font-bold text-indigo-400 hover:text-indigo-300">
          🚀 Founders Pass
        </Link>
        <Link href="/founderspass/dashboard" className="text-zinc-400 hover:text-white">
          Dashboard
        </Link>
        <Link href="/founderspass/experiments" className="text-zinc-400 hover:text-white">
          Experiments
        </Link>
        <Link href="/founders-pass/flags" className="text-zinc-400 hover:text-white">
          Flags
        </Link>
        <Link href="/founders-pass/sites" className="text-zinc-400 hover:text-white">
          Sites
        </Link>
        <Link href="/founders-pass/integrations" className="text-zinc-400 hover:text-white">
          Integrations
        </Link>
        <Link href="/founders-pass/actions" className="text-zinc-400 hover:text-white">
          Actions
        </Link>
        <Link href="/founders-pass/audit" className="text-zinc-400 hover:text-white">
          Audit
        </Link>
        <div className="flex-1" />
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-xs">
          ← Back to CubiQo
        </Link>
      </nav>
      {children}
    </div>
  )
}
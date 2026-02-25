import type { Metadata } from 'next'
import { MediaGenerator } from '@/components/media'

export const metadata: Metadata = {
  title: 'Generate Media | CubiQo',
  description: 'Generate images and videos with AI using CubiQo'
}

export default function GeneratePage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-orange-500">CubiQo</a>
          <div className="flex items-center gap-4">
            <a href="/chat" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              Chat
            </a>
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Generate
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="h-[calc(100vh-120px)]">
          <MediaGenerator />
        </div>
      </div>
    </main>
  )
}

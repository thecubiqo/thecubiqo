'use client'

interface DevConsoleHeaderProps {
  isAuthenticated: boolean
  userEmail?: string | null
  onClose: () => void
}

export default function DevConsoleHeader({
  isAuthenticated,
  userEmail,
  onClose,
}: DevConsoleHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700 cursor-move select-none shrink-0"
      data-drag-handle
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">⚡ Dev Console</span>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isAuthenticated ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          {isAuthenticated ? 'Connected' : 'Disconnected'}
        </span>
        {userEmail && (
          <span className="text-xs text-zinc-500 truncate max-w-[140px]">
            {userEmail}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">Ctrl/Cmd+`</span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors p-1"
          aria-label="Close Dev Console"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

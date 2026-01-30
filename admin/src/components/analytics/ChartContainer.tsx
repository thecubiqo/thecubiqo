'use client'

interface ChartContainerProps {
  title: string
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  className?: string
}

export default function ChartContainer({ title, children, loading, error, className = '' }: ChartContainerProps) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 lg:p-6 ${className} min-w-0 overflow-hidden`}>
      <h3 className="text-base lg:text-lg font-semibold text-white mb-4 break-words">{title}</h3>
      <div className="min-w-0 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400 break-words">Error: {error}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}


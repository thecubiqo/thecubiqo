'use client'

interface MetricCardProps {
  value: string | number
  label: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  color?: 'orange' | 'red' | 'yellow' | 'green-blue'
}

export default function MetricCard({ value, label, trend, icon, color = 'orange' }: MetricCardProps) {
  const colorClasses = {
    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    'green-blue': 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  return (
    <div className={`bg-slate-800/50 border ${colorClasses[color]} rounded-xl p-6 min-w-0`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-sm font-medium text-slate-400 truncate flex-1">{label}</p>
        {icon && <div className="text-slate-400 flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 min-w-0">
        <p className="text-2xl lg:text-3xl font-bold text-white truncate">{value}</p>
        {trend && (
          <span className={`text-sm font-medium whitespace-nowrap flex-shrink-0 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}


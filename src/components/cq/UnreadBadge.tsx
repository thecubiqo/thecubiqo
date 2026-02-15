'use client'

/**
 * UnreadBadge - Notification badge for unread messages
 */

interface UnreadBadgeProps {
  count: number
  className?: string
}

export function UnreadBadge({ count, className = '' }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <div
      className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF6F00] text-white text-[11px] font-bold ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  )
}

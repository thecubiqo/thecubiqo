'use client'

/**
 * Duo Mode Toggle
 * Enables the AI to proactively interject with advice (health, safety, tone, etc.)
 * during the user's activity.
 */

import { useState } from 'react'

interface DuoModeToggleProps {
    isEnabled: boolean
    onToggle: (enabled: boolean) => void
}

export function DuoModeToggle({ isEnabled, onToggle }: DuoModeToggleProps) {
    return (
        <button
            onClick={() => onToggle(!isEnabled)}
            className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
        ${isEnabled
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }
      `}
        >
            <div className={`
        w-2 h-2 rounded-full transition-all duration-300
        ${isEnabled ? 'bg-purple-400 animate-pulse' : 'bg-zinc-400'}
      `} />

            <span className={`text-xs font-medium transition-colors ${isEnabled ? 'text-purple-300' : 'text-zinc-500'}`}>
                Duo Mode {isEnabled ? 'ON' : 'OFF'}
            </span>

            {isEnabled && (
                <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-ping opacity-20" />
            )}
        </button>
    )
}

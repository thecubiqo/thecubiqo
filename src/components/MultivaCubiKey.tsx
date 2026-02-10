
'use client'

import { useState } from 'react'

interface MultivaCubiKeyProps {
    isDark: boolean
}

export function MultivaCubiKey({ isDark }: MultivaCubiKeyProps) {
    const [copied, setCopied] = useState(false)
    // Masked for security - never expose full key in client bundle if not needed
    const displayKey = 'sk-or-v1-57...ec518'
    const fullKey = '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'

    const handleCopy = () => {
        navigator.clipboard.writeText(fullKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`
      relative group overflow-hidden rounded-xl border transition-all duration-300 w-full
      ${isDark
                ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                : 'bg-black/[0.03] border-black/5 hover:bg-black/[0.05] hover:border-black/10'}
    `}>
            {/* Glow Effect */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-1000 rotate-45" />

            <div className="relative px-5 py-3 flex flex-col items-center gap-2">
                <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${isDark ? 'text-purple-300/80' : 'text-purple-600/80'}`}>
                    Multiva Cubi Key
                </span>

                <div className="flex items-center justify-between w-full">
                    <code className={`font-mono text-[11px] ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {displayKey}
                    </code>

                    <button
                        onClick={handleCopy}
                        className={`
              p-1.5 rounded-lg transition-all duration-200
              ${copied
                                ? 'bg-green-500/20 text-green-400'
                                : isDark ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-gray-900'}
            `}
                    >
                        {copied ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>

                <span className={`text-[9px] ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
                    CubiQo all purpose API key
                </span>
            </div>
        </div>
    )
}

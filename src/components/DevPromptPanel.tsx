'use client'

import React, { useState, useRef, useEffect } from 'react'

interface DevPromptPanelProps {
    isOpen: boolean
    onClose: () => void
    onPromptAction: (prompt: string) => void
}

export function DevPromptPanel({ isOpen, onClose, onPromptAction }: DevPromptPanelProps) {
    const [prompt, setPrompt] = useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim()) return

        onPromptAction(prompt)
        setPrompt('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed left-6 bottom-16 z-[70] w-80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 origin-bottom-left"
            style={{
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <h3 className="text-xs font-semibold text-white/70 tracking-wide uppercase">Dev Prompt Console</h3>
                <button
                    onClick={onClose}
                    className="text-white/30 hover:text-white/60 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Body */}
            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    <textarea
                        ref={inputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Give a command to CubiQo directly..."
                        className="w-full h-24 bg-black/20 text-sm text-white placeholder-white/20 p-3 rounded-lg border border-white/10 focus:border-white/20 focus:outline-none resize-none mb-3"
                        style={{ fontFamily: 'monospace' }}
                    />
                    <div className="flex justify-between items-center text-[10px] text-white/30">
                        <span>Shift+Enter for new line</span>
                        <button
                            type="submit"
                            disabled={!prompt.trim()}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Run Action
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    )
}

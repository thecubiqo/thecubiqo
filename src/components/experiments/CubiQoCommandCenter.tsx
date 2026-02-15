'use client'

import { useState, useRef, useEffect } from 'react'

interface CubiQoCommandCenterProps {
    onCommand: (command: string) => Promise<void>
    isProcessing?: boolean
}

export function CubiQoCommandCenter({ onCommand, isProcessing = false }: CubiQoCommandCenterProps) {
    const [command, setCommand] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!command.trim() || isProcessing) return

        const currentCommand = command
        setCommand('')
        await onCommand(currentCommand)
    }

    // Shortcut: Press '/' to focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
            <form
                onSubmit={handleSubmit}
                className={`relative group bg-gray-900/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl transition-all duration-500 ${isProcessing ? 'ring-2 ring-purple-500/50 scale-[1.02]' : 'hover:border-purple-500/30'
                    }`}
            >
                {/* Premium Gradient Border Animated */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy ${isProcessing ? 'opacity-60' : ''}`} />

                <div className="relative flex items-center gap-3 bg-gray-900/90 rounded-[14px] px-4 py-2">
                    <div className="flex-shrink-0 relative">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg shadow-lg ${isProcessing ? 'animate-pulse' : ''}`}>
                            🤖
                        </div>
                        {isProcessing && (
                            <div className="absolute -inset-1 rounded-full border border-purple-400/50 animate-ping opacity-75" />
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder={isProcessing ? "CubiQo is manipulating spacetime..." : "Command CubiQo (e.g. 'Add neon effects to Variant B')"}
                        disabled={isProcessing}
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-gray-500 py-2"
                    />

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-black text-gray-400">
                            <span className="opacity-50">PRESS</span>
                            <span className="text-gray-200">/</span>
                            <span className="opacity-50">TO FOCUS</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!command.trim() || isProcessing}
                            className={`p-2 rounded-xl transition-all ${command.trim() && !isProcessing
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Processing Overlay Label */}
                {isProcessing && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600/90 backdrop-blur-sm rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] animate-bounce">
                        Agentic Stream Active
                    </div>
                )}
            </form>
        </div>
    )
}

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 flex items-center justify-center bg-black text-red-500 font-mono text-xs p-10 z-[100] overflow-auto">
                    <div className="max-w-4xl space-y-4">
                        <h1 className="text-xl font-bold">Client-Side Runtime Exception</h1>
                        <p className="border-b border-white/20 pb-4">{this.state.error?.message}</p>
                        <div className="bg-white/5 p-4 rounded text-white/50 whitespace-pre-wrap">
                            {this.state.error?.stack}
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

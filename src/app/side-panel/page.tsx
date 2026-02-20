'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { v4 as uuidv4 } from 'uuid'
import { type ColorName } from '@/config/colors'

export default function SidePanelPage() {
    const [currentUrl, setCurrentUrl] = useState<string | null>(null)
    const [pageTitle, setPageTitle] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentColor, setCurrentColor] = useState<ColorName>('ORANGE')

    // Initialize Session
    useEffect(() => {
        // Try to recover session from local storage or create new
        const stored = localStorage.getItem('cubiqo_session_id')
        if (stored) {
            setSessionId(stored)
        } else {
            const newId = uuidv4()
            localStorage.setItem('cubiqo_session_id', newId)
            setSessionId(newId)
        }
    }, [])

    /**
     * Send a browser control command to the extension.
     * Returns a promise that resolves with the result.
     */
    const sendBrowserControl = useCallback((action: string, params: Record<string, unknown> = {}): Promise<unknown> => {
        return new Promise((resolve) => {
            const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

            const handleResult = (event: MessageEvent) => {
                if (
                    event.data?.type === 'BROWSER_CONTROL_RESULT' &&
                    event.data?.requestId === requestId
                ) {
                    window.removeEventListener('message', handleResult)
                    resolve(event.data.result)
                }
            }

            window.addEventListener('message', handleResult)

            // Send to parent (extension sidepanel.js).
            // Uses '*' because the chrome-extension:// origin ID is dynamic
            // and not known at build time. The extension sidepanel.js validates
            // incoming messages by checking event.origin against TARGET_ORIGIN.
            window.parent.postMessage({
                type: 'BROWSER_CONTROL',
                action,
                params,
                requestId,
            }, '*')

            // Timeout after 10 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResult)
                resolve({ success: false, error: 'Request timed out' })
            }, 10000)
        })
    }, [])

    useEffect(() => {
        // Listen for messages from the extension parent window
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'EXTENSION_CONTEXT_UPDATE') {
                console.log('Extension context received:', event.data)
                setCurrentUrl(event.data.url)
                setPageTitle(event.data.title)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    return (
        <div className="h-screen w-full bg-black flex flex-col">
            {/* Context Header */}
            {currentUrl && (
                <div className="bg-gray-900 border-b border-gray-800 px-3 py-2 text-xs flex items-center gap-2 text-gray-400">
                    <span>
                        <span className="mr-1">👁️</span>
                        <span className="truncate max-w-[200px] inline-block align-bottom">{new URL(currentUrl).hostname}</span>
                    </span>
                </div>
            )}

            {/* Reusing Chat Container with cleaner layout for side panel */}
            <div className="flex-1 overflow-hidden">
                <ChatContainer
                    sessionId={sessionId}
                    currentColor={currentColor}
                    onColorChange={setCurrentColor}
                    initialContext={currentUrl ? `User is currently viewing: ${currentUrl} (${pageTitle})` : undefined}
                    isExtension={true}
                // isGuest removed to use API route which bypasses RLS via admin client
                />
            </div>

            {/* Debug Info for Extension */}
            <div className="bg-gray-900 p-2 text-[10px] text-gray-500 font-mono">
                Session: {sessionId ? sessionId.slice(0, 8) + '...' : 'None'} | Color: {currentColor}
            </div>
        </div>
    )
}

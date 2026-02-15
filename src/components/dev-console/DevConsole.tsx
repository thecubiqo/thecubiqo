'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import DevConsoleHeader from './DevConsoleHeader'
import PromptPane from './PromptPane'
import LiveCoderPane from './LiveCoderPane'
import ConfirmationModal from './ConfirmationModal'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const MIN_WIDTH = 640
const MIN_HEIGHT = 380
const DEFAULT_WIDTH = 960
const DEFAULT_HEIGHT = 520

export default function DevConsole() {
  const { isAdmin, isAuthenticated, user, isLoading } = useAdminAuth()
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: -1 }) // y = -1 means bottom-anchored
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [liveCode, setLiveCode] = useState('// Start coding here\n')
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    description: string
    phrase: string
    onConfirm: () => void
  } | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const resizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Keyboard shortcut: Ctrl/Cmd + `
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        setVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Compute actual Y position (bottom-anchored by default)
  const computedY =
    position.y === -1
      ? (typeof window !== 'undefined' ? window.innerHeight - size.height - 16 : 100)
      : position.y

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-handle]')) return
    dragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - computedY,
    }
    e.preventDefault()
  }, [position.x, computedY])

  // Resize handling
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true
    dragOffset.current = {
      x: e.clientX,
      y: e.clientY,
    }
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.current.x),
          y: Math.max(0, e.clientY - dragOffset.current.y),
        })
      }
      if (resizing.current) {
        const dx = e.clientX - dragOffset.current.x
        const dy = e.clientY - dragOffset.current.y
        setSize((s) => ({
          width: Math.max(MIN_WIDTH, s.width + dx),
          height: Math.max(MIN_HEIGHT, s.height + dy),
        }))
        dragOffset.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleMouseUp = () => {
      dragging.current = false
      resizing.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Apply code from prompt to live coder
  const handleCodePatch = (code: string) => {
    setConfirmModal({
      title: 'Apply Code Patch',
      description: 'This will replace the current code in the Live Coder with the agent response.',
      phrase: 'apply',
      onConfirm: () => setLiveCode(code),
    })
  }

  // Don't render while loading or if not admin
  if (isLoading || !isAdmin) return null
  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-medium rounded-lg shadow-lg transition-all"
        title="Open Dev Console (Ctrl/Cmd+`)"
      >
        ⚡ Dev Console
      </button>
    )
  }

  return (
    <>
      <div
        ref={panelRef}
        className="fixed z-50 flex flex-col bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        style={{
          left: position.x,
          top: computedY,
          width: size.width,
          height: size.height,
        }}
        onMouseDown={handleMouseDown}
      >
        <DevConsoleHeader
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          onClose={() => setVisible(false)}
        />

        {/* Two-pane layout */}
        <div className="flex flex-1 min-h-0">
          {/* Prompt Pane – 40% */}
          <div className="border-r border-zinc-700" style={{ width: '40%' }}>
            <PromptPane onCodePatch={handleCodePatch} />
          </div>
          {/* Live Coder Pane – 60% */}
          <div style={{ width: '60%' }}>
            <LiveCoderPane initialCode={liveCode} />
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <svg className="w-3 h-3 text-zinc-600 absolute bottom-0.5 right-0.5" viewBox="0 0 10 10">
            <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5v4H5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {confirmModal && (
        <ConfirmationModal
          isOpen
          title={confirmModal.title}
          description={confirmModal.description}
          confirmPhrase={confirmModal.phrase}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </>
  )
}

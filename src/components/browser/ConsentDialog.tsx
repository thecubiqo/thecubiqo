'use client'

/**
 * Browser Consent Dialog
 * Displays when browser automation needs user approval
 * Shows domain, action type, and optional screenshot preview
 * 
 * WCAG 2.1 AA Compliant:
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Focus management (trap focus in dialog)
 * - ARIA labels and roles
 * - Screen reader announcements
 * - High contrast (4.5:1 text, 3:1 UI)
 * 
 * Author: Bubbles (Frontend Developer)
 * Sprint 1: Browser Consent UX
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, AlertTriangle, Globe, MousePointer, Image as ImageIcon } from 'lucide-react'

export interface ConsentRequest {
  requestId: string
  domain: string
  url: string
  actionType: 'navigate' | 'click' | 'fill' | 'extract'
  purpose: string
  screenshotUrl?: string
  timestamp: number
}

interface ConsentDialogProps {
  request: ConsentRequest | null
  onApprove: (requestId: string, remember: boolean, reason?: string) => void
  onDeny: (requestId: string, reason?: string) => void
  isOpen: boolean
  onClose: () => void
  timeoutSeconds?: number // Auto-deny after timeout (default: 60 seconds)
}

export function ConsentDialog({
  request,
  onApprove,
  onDeny,
  isOpen,
  onClose,
  timeoutSeconds = 60
}: ConsentDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const [reason, setReason] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds)
  const [showScreenshot, setShowScreenshot] = useState(false)
  
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && request) {
      setRememberChoice(false)
      setReason('')
      setTimeRemaining(timeoutSeconds)
      setShowScreenshot(false)
      
      // Focus first button
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)
    }
  }, [isOpen, request, timeoutSeconds])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !request) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-deny on timeout
          onDeny(request.requestId, 'Timeout - no response within 60 seconds')
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, request, onDeny, onClose])

  // Keyboard navigation - Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!request) return
        onDeny(request.requestId, reason || 'User denied')
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, request, reason, onDeny, onClose])

  // Focus trap
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!dialogRef.current) return

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') handleTabKey(e)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleTabKey])

  const handleApprove = () => {
    if (!request) return
    onApprove(request.requestId, rememberChoice, reason || undefined)
    onClose()
  }

  const handleDeny = () => {
    if (!request) return
    onDeny(request.requestId, reason || 'User denied')
    onClose()
  }

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'navigate': return 'Navigate to page'
      case 'click': return 'Click element'
      case 'fill': return 'Fill form'
      case 'extract': return 'Extract data'
      default: return 'Perform action'
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'navigate': return Globe
      case 'click': return MousePointer
      case 'fill': return MousePointer
      case 'extract': return ImageIcon
      default: return Globe
    }
  }

  if (!isOpen || !request) return null

  const ActionIcon = getActionIcon(request.actionType)
  const progressPercent = (timeRemaining / timeoutSeconds) * 100

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={handleDeny}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
                   w-[90vw] max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl
                   overflow-hidden"
      >
        {/* Header with timer */}
        <div className="relative bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" aria-hidden="true" />
              <div>
                <h2 id="consent-title" className="text-lg font-bold text-white">
                  Browser Action Requested
                </h2>
                <p className="text-sm text-white/90">
                  {timeRemaining}s remaining
                </p>
              </div>
            </div>
            <button
              ref={firstFocusableRef}
              onClick={handleDeny}
              aria-label="Close and deny request"
              className="text-white hover:text-gray-200 transition-colors focus:outline-none
                         focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-600 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={timeRemaining}
              aria-valuemin={0}
              aria-valuemax={timeoutSeconds}
              aria-label="Time remaining"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div id="consent-description" className="space-y-3">
            {/* Domain */}
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">Domain</p>
                <p className="text-sm font-medium text-white truncate">{request.domain}</p>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <ActionIcon className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">Action</p>
                <p className="text-sm font-medium text-white">{getActionLabel(request.actionType)}</p>
              </div>
            </div>

            {/* Purpose */}
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Purpose</p>
              <p className="text-sm text-white">{request.purpose}</p>
            </div>

            {/* Screenshot preview (if available) */}
            {request.screenshotUrl && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowScreenshot(!showScreenshot)}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-750 transition-colors
                             text-left flex items-center justify-between text-sm text-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={showScreenshot}
                  aria-controls="screenshot-preview"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
                    Screenshot Preview
                  </span>
                  <span className="text-xs">{showScreenshot ? 'Hide' : 'Show'}</span>
                </button>
                {showScreenshot && (
                  <div id="screenshot-preview" className="p-3 bg-black">
                    <img
                      src={request.screenshotUrl}
                      alt="Screenshot of target page"
                      className="w-full rounded border border-gray-700"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remember choice */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-500
                         focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                         focus:ring-offset-gray-900 cursor-pointer"
              aria-describedby="remember-description"
            />
            <div className="flex-1">
              <span className="text-sm text-white group-hover:text-gray-200">
                Remember my choice for this domain
              </span>
              <p id="remember-description" className="text-xs text-gray-400 mt-1">
                Future actions on {request.domain} will be automatically {rememberChoice ? 'approved' : 'reviewed'}
              </p>
            </div>
          </label>

          {/* Optional reason */}
          <div>
            <label htmlFor="reason-input" className="block text-sm text-gray-400 mb-2">
              Reason (optional)
            </label>
            <textarea
              id="reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a note about your decision..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-sm text-white placeholder-gray-500
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDeny}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white
                         rounded-lg font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                         focus:ring-offset-gray-900"
              aria-label="Deny browser action"
            >
              Deny
            </button>
            <button
              ref={lastFocusableRef}
              onClick={handleApprove}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white
                         rounded-lg font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                         focus:ring-offset-gray-900"
              aria-label="Approve browser action"
            >
              Approve
            </button>
          </div>

          {/* Warning footer */}
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
            Only approve actions on domains you trust. All actions are logged.
          </p>
        </div>
      </div>
    </>
  )
}

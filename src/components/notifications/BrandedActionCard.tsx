'use client'

import { useState } from 'react'
import { getIntegration } from '@/lib/notifications/integration-registry'

interface BrandedActionCardProps {
  integrationName: string
  title: string
  body?: string
  data?: Record<string, any>
  onAction?: (actionType: string, actionData: any) => Promise<void>
  onDismiss?: () => void
}

export function BrandedActionCard({
  integrationName,
  title,
  body,
  data,
  onAction,
  onDismiss
}: BrandedActionCardProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const integration = getIntegration(integrationName)

  if (!integration) return null

  async function handleAction(actionType: string, actionData: any) {
    if (!onAction) return
    setIsExecuting(true)
    try {
      await onAction(actionType, actionData)
    } finally {
      setIsExecuting(false)
    }
  }

  // WhatsApp Card
  if (integrationName === 'whatsapp') {
    return (
      <div
        className="rounded-2xl p-6 border-2 shadow-lg"
        style={{
          backgroundColor: '#000',
          borderColor: integration.color + '40'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: integration.color + '20' }}
          >
            {integration.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs" style={{ color: integration.color }}>
              WhatsApp Message
            </p>
          </div>
        </div>

        {/* Message Body */}
        {body && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-white">{body}</p>
            {data?.sender && (
              <p className="text-xs text-gray-400 mt-2">From: {data.sender}</p>
            )}
          </div>
        )}

        {/* Reply Input */}
        <div className="mb-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/40"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('reply', { message: replyText })}
            disabled={!replyText || isExecuting}
            className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: integration.color }}
          >
            {isExecuting ? 'Sending...' : '✓ Send Reply'}
          </button>
          <button
            onClick={onDismiss}
            className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // Telegram Card
  if (integrationName === 'telegram') {
    return (
      <div
        className="rounded-2xl p-6 border-2 shadow-lg"
        style={{
          backgroundColor: '#000',
          borderColor: integration.color + '40'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: integration.color + '20' }}
          >
            {integration.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs" style={{ color: integration.color }}>
              Telegram Message
            </p>
          </div>
        </div>

        {body && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-white">{body}</p>
          </div>
        )}

        <div className="mb-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/40"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAction('reply', { message: replyText })}
            disabled={!replyText || isExecuting}
            className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: integration.color }}
          >
            {isExecuting ? 'Sending...' : '✈️ Send'}
          </button>
          <button
            onClick={onDismiss}
            className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // Philips Hue Card (Smart Home)
  if (integrationName === 'philips_hue') {
    const [brightness, setBrightness] = useState(data?.brightness || 50)
    const [isOn, setIsOn] = useState(data?.state === 'on')

    return (
      <div
        className="rounded-2xl p-6 border-2 shadow-lg"
        style={{
          backgroundColor: '#000',
          borderColor: integration.color + '40'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: integration.color + (isOn ? '40' : '20'),
              boxShadow: isOn ? `0 0 20px ${integration.color}80` : 'none'
            }}
          >
            {integration.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs" style={{ color: integration.color }}>
              Philips Hue Light
            </p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-4">
          {/* On/Off Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Power</span>
            <button
              onClick={() => {
                setIsOn(!isOn)
                handleAction('set_state', { state: !isOn ? 'on' : 'off' })
              }}
              className={`w-12 h-6 rounded-full transition-all ${
                isOn ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Brightness Slider */}
          {isOn && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Brightness</span>
                <span className="text-orange-400 font-bold">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                onMouseUp={() =>
                  handleAction('set_brightness', { brightness })
                }
                className="w-full"
                style={{
                  accentColor: integration.color
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          Close
        </button>
      </div>
    )
  }

  // Generic fallback
  return (
    <div className="rounded-2xl p-6 border-2 border-white/20 bg-black shadow-lg">
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      {body && <p className="text-gray-400 mb-4">{body}</p>}
      <button
        onClick={onDismiss}
        className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
      >
        Dismiss
      </button>
    </div>
  )
}

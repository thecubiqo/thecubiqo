'use client'

import { useState } from 'react'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { BrandedActionCard } from '@/components/notifications/BrandedActionCard'
import { notificationManager } from '@/lib/notifications/notification-manager'

export default function NotificationsDemoPage() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showTelegram, setShowTelegram] = useState(false)
  const [showHue, setShowHue] = useState(false)

  async function createTestNotification(integrationName: string) {
    try {
      // In real app, this would come from the integration
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_id: 'test-id',
          type: 'message',
          title: `Test notification from ${integrationName}`,
          body: 'This is a test notification to demonstrate the system',
          data: { integration_name: integrationName },
          priority: 2
        })
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header with Notification Center */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-bold">Unified Notifications Demo</h1>
        <NotificationCenter />
      </div>

      {/* Demo Controls */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-semibold mb-4">Test Notifications</h2>
          <p className="text-gray-400 mb-6">
            Click the buttons below to create test notifications and see branded action cards
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                createTestNotification('whatsapp')
                setShowWhatsApp(true)
              }}
              className="p-4 bg-[#25D366] hover:bg-[#1ea952] rounded-xl font-medium transition-all"
            >
              💬 WhatsApp Message
            </button>

            <button
              onClick={() => {
                createTestNotification('telegram')
                setShowTelegram(true)
              }}
              className="p-4 bg-[#0088cc] hover:bg-[#006ba3] rounded-xl font-medium transition-all"
            >
              ✈️ Telegram Message
            </button>

            <button
              onClick={() => {
                createTestNotification('philips_hue')
                setShowHue(true)
              }}
              className="p-4 bg-[#FF6000] hover:bg-[#cc4d00] rounded-xl font-medium transition-all"
            >
              💡 Philips Hue Light
            </button>
          </div>
        </div>

        {/* Branded Action Cards */}
        <div className="space-y-6">
          {showWhatsApp && (
            <div>
              <h3 className="text-xl font-semibold mb-4">WhatsApp Action Card</h3>
              <BrandedActionCard
                integrationName="whatsapp"
                title="Message from John"
                body="Hey, can you send me that report we discussed yesterday?"
                data={{ sender: 'John Doe', phone: '+1234567890' }}
                onAction={async (actionType, actionData) => {
                  console.log('WhatsApp action:', actionType, actionData)
                  alert(`WhatsApp: ${actionType} - ${JSON.stringify(actionData)}`)
                  setShowWhatsApp(false)
                }}
                onDismiss={() => setShowWhatsApp(false)}
              />
            </div>
          )}

          {showTelegram && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Telegram Action Card</h3>
              <BrandedActionCard
                integrationName="telegram"
                title="@mention in Engineering Team"
                body="@alex Can you review PR #42? We need your feedback before merging."
                data={{ group: 'Engineering Team', user: 'Sarah' }}
                onAction={async (actionType, actionData) => {
                  console.log('Telegram action:', actionType, actionData)
                  alert(`Telegram: ${actionType} - ${JSON.stringify(actionData)}`)
                  setShowTelegram(false)
                }}
                onDismiss={() => setShowTelegram(false)}
              />
            </div>
          )}

          {showHue && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Philips Hue Action Card</h3>
              <BrandedActionCard
                integrationName="philips_hue"
                title="Living Room Lights"
                data={{ state: 'on', brightness: 75, room: 'Living Room' }}
                onAction={async (actionType, actionData) => {
                  console.log('Philips Hue action:', actionType, actionData)
                  alert(`Hue: ${actionType} - ${JSON.stringify(actionData)}`)
                }}
                onDismiss={() => setShowHue(false)}
              />
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-semibold mb-4">Features Implemented</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Real-time notifications with unread badge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Branded action cards per platform (WhatsApp, Telegram, Philips Hue)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Never leave CUBIQO screen - all actions inside</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Voice/text reply interfaces</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Smart home device controls (lights, brightness)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Database with RLS policies for security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Notification center with filtering and mark-as-read</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">⚡</span>
              <span>Ready for 100+ integrations (social media, smart home, chat)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

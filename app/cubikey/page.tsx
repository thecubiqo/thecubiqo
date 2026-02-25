'use client'

import { AppLayout } from '@/components/AppLayout'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/hooks/useAuth'

export default function CubiKeyPage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const isSetup = profile && (profile as any).is_pro

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_123PlaceholderForCubiKey' // To be replaced with real Stripe Price ID
        }),
      })

      const data = await response.json()
      if (data.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        await (stripe as any)?.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePortal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">CubiKey</h1>
          <p className="text-white/60 mb-8">
            Access unlocked bandwidth, limitless memories, and unified architecture capabilities.
          </p>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-400 text-sm rounded-full mb-4 border border-orange-500/30">
                    {isSetup ? 'Active' : 'Unsubscribed'}
                  </span>
                  <p className="text-white/80">
                    CubiKey unlocks limit overrides and provides access to premium network bridges.
                  </p>
                </div>
                {isSetup ? (
                  <button
                    onClick={handlePortal}
                    disabled={isLoading}
                    className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Manage Billing
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-400 hover:to-orange-500 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Forge CubiKey ($15/mo)'}
                  </button>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Network Privileges</h3>
                <ul className="list-disc list-inside text-white/60 space-y-2">
                  <li>Tier-1 Intelligence (DeepSeek V3 / Opus) Priority Access</li>
                  <li>BYO API Mode (No Artificial Limits)</li>
                  <li>Automated Social Army Routing</li>
                  <li>Full Memory Retention & Vector Synapse Graphing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

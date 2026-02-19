'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWAInstallPrompt — prompts users to install CubiQo as a native app.
 *
 * • On Android / desktop Chrome / Edge: intercepts `beforeinstallprompt` and
 *   shows a branded install banner.
 * • On iOS Safari: detects the platform and shows manual "Add to Home Screen"
 *   instructions since iOS doesn't fire `beforeinstallprompt`.
 * • Respects a 24-hour dismiss cooldown stored in localStorage.
 * • Hides automatically once the app is running in standalone mode.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // ---- helpers ----
  const isStandalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)

  const isDismissed = () => {
    if (typeof window === 'undefined') return true
    const ts = localStorage.getItem('pwa-install-dismissed')
    if (!ts) return false
    return Date.now() - Number(ts) < 24 * 60 * 60 * 1000 // 24 h cooldown
  }

  const isIOS = () =>
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream

  // ---- lifecycle ----
  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!isDismissed()) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // iOS: show manual instructions after a short delay
    if (isIOS() && !isDismissed()) {
      const timer = setTimeout(() => setShowIOSInstructions(true), 3000)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ---- actions ----
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
    setShowBanner(false)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()))
    setShowBanner(false)
    setShowIOSInstructions(false)
  }, [])

  // Don't render anything if already installed or nothing to show
  if (isInstalled || (!showBanner && !showIOSInstructions)) return null

  // ---- render ----
  return (
    <AnimatePresence>
      {(showBanner || showIOSInstructions) && (
        <motion.div
          key="pwa-install-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="alert"
          aria-label="Install CubiQo app"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div
            className="rounded-2xl border border-white/10 bg-black/90 p-4 shadow-xl backdrop-blur-xl"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.08)' }}
          >
            {/* Header row */}
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="3" stroke="white" strokeWidth="2" />
                  <rect x="8" y="8" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.9" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Install CubiQo
                </h3>
                <p className="mt-0.5 text-xs text-white/60 leading-snug">
                  {showIOSInstructions
                    ? 'Add CubiQo to your Home Screen for instant access.'
                    : 'Get the full app experience — faster, offline-ready, and always one tap away.'}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* iOS instructions or Install button */}
            {showIOSInstructions ? (
              <div className="mt-3 rounded-xl bg-white/5 p-3">
                <ol className="space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">1</span>
                    <span>
                      Tap the <strong className="text-white/90">Share</strong> button
                      <svg className="ml-1 inline-block h-3.5 w-3.5 text-white/50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 3v12M12 3l-4 4M12 3l4 4M4 15v4h16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">2</span>
                    <span>Scroll and tap <strong className="text-white/90">Add to Home Screen</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">3</span>
                    <span>Tap <strong className="text-white/90">Add</strong> to confirm</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/15"
                >
                  Not Now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

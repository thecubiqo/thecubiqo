'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      let intervalId: ReturnType<typeof setInterval> | undefined
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically (every 60 minutes)
          intervalId = setInterval(() => registration.update(), 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
      return () => {
        if (intervalId) clearInterval(intervalId)
      }
    }
  }, [])

  return null
}

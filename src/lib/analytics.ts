/**
 * TFR-012: PostHog 15-Event Analytics Funnel
 *
 * Instruments all critical user journeys to measure:
 * - Activation rate (target: >20%)
 * - NPS proxy signals
 * - Voice/Chat engagement split
 * - Conversion funnel from Landing → Paid
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics'
 *   analytics.track('chat_message_sent', { zone: 'TEAL', provider: 'minimax' })
 */

// Funnel event taxonomy — 15 events covering the full user journey
export type AnalyticsEvent =
    // Acquisition (1-3)
    | 'page_view'               // Any page load
    | 'landing_cta_click'       // CTA button on landing
    | 'auth_started'            // User initiated sign-in

    // Activation (4-7)
    | 'auth_completed'          // Magic link clicked, session created
    | 'onboarding_intent_set'   // User chose a branch (solopreneur/dev/etc)
    | 'onboarding_completed'    // Full onboarding flow done
    | 'first_chat_sent'         // Very first chat message sent

    // Engagement (8-11)
    | 'chat_message_sent'       // Any chat message
    | 'voice_first_use'         // First TTS playback
    | 'voice_input_used'        // STT mic activated
    | 'zone_switched'           // User changed RGY zone

    // Feature Depth (12-13)
    | 'journal_entry_created'   // Journal write
    | 'social_post_approved'    // Human approved a social post
    | 'emergent_deploy_triggered' // Studio deploy fired

    // Monetization (14-15)
    | 'pricing_page_viewed'     // Visited /pricing
    | 'checkout_started'        // Stripe checkout initiated

export interface AnalyticsProperties {
    zone?: string
    provider?: string
    intent?: string
    module?: string
    tier?: string
    from_zone?: string
    to_zone?: string
    [key: string]: string | number | boolean | undefined
}

class CubiQoAnalytics {
    private posthog: any = null
    private initialized = false
    private queue: Array<{ event: AnalyticsEvent; props: AnalyticsProperties }> = []

    async init() {
        if (this.initialized || typeof window === 'undefined') return

        const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
        if (!apiKey) {
            console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled')
            return
        }

        try {
            // @ts-ignore - bypassing missing types while npm resolves
            const { default: posthog } = await import('posthog-js')
            posthog.init(apiKey, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                capture_pageview: false, // We'll fire page_view manually
                persistence: 'localStorage',
                autocapture: false // Only capture what we explicitly track
            })
            this.posthog = posthog
            this.initialized = true

            // Flush queue
            this.queue.forEach(({ event, props }) => posthog.capture(event, props))
            this.queue = []
        } catch (e) {
            console.warn('[Analytics] PostHog init failed:', e)
        }
    }

    track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
        const props = {
            ...properties,
            timestamp: new Date().toISOString(),
            app: 'cubiqo'
        }

        if (this.posthog) {
            this.posthog.capture(event, props)
        } else {
            // Queue until PostHog loads
            this.queue.push({ event, props })
            console.debug(`[Analytics] Queued: ${event}`, props)
        }
    }

    identify(userId: string, traits: Record<string, string | number | boolean> = {}) {
        if (this.posthog) {
            this.posthog.identify(userId, traits)
        }
    }

    page(pageName: string, properties: AnalyticsProperties = {}) {
        this.track('page_view', { page: pageName, ...properties })
    }

    reset() {
        this.posthog?.reset()
    }
}

// Singleton
export const analytics = new CubiQoAnalytics()

// Auto-init on import (client-side only)
if (typeof window !== 'undefined') {
    analytics.init()
}

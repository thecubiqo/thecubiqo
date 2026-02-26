import Stripe from 'stripe'

/**
 * Stripe SDK initialization
 * 
 * IMPORTANT: Set STRIPE_SECRET_KEY in your environment variables.
 * Without it, all Stripe API calls will fail at runtime.
 * 
 * Required env vars:
 *   STRIPE_SECRET_KEY           - Server-side secret key (sk_test_... or sk_live_...)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Client-side publishable key (pk_test_... or pk_live_...)
 *   STRIPE_WEBHOOK_SECRET       - Webhook signing secret (whsec_...)
 */
function createStripeClient(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
        // During build time, return a stub that will throw on actual API calls
        // This prevents build failures while ensuring runtime calls fail with a clear message
        console.warn('[Stripe] STRIPE_SECRET_KEY not set — Stripe API calls will fail at runtime')
    }
    return new Stripe(key || 'sk_placeholder_will_fail', {
        apiVersion: '2023-10-16' as any,
        appInfo: {
            name: 'Cubiqo',
            version: '1.0.0'
        }
    })
}

export const stripe = createStripeClient()

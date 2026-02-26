import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!key) {
            console.warn('[Stripe Client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set — checkout will not work')
        }
        stripePromise = loadStripe(key || '')
    }
    return stripePromise
}

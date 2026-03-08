import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-01-27.acacia' as any
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripe()
        const payload = await req.text()
        const signature = req.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
        }

        let event: Stripe.Event
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`)
            return NextResponse.json({ error: err.message }, { status: 400 })
        }

        // Initialize Supabase Admin to bypass RLS when updating backend
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session

            // client_reference_id was passed during session creation
            const userId = session.client_reference_id
            const subscriptionId = session.subscription as string
            const customerId = session.customer as string
            const tierId = session.metadata?.tier_id || 'pro' // fallback

            console.log(`[Stripe Webhook] Successful checkout for user ${userId}, tier: ${tierId}`)

            if (userId) {
                // Update user profile in Supabase
                const { error: dbError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        tier_id: tierId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (dbError) {
                    console.error(`[Stripe Webhook] Failed to update user ${userId}:`, dbError.message)
                    // We still return 200 to Stripe so it doesn't retry endlessly,
                    // but logging the error is crucial.
                }
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription
            const customerId = subscription.customer as string

            console.log(`[Stripe Webhook] Subscription deleted for customer ${customerId}`)

            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .update({
                    tier_id: 'free',
                    stripe_subscription_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_customer_id', customerId)

            if (dbError) {
                console.error(`[Stripe Webhook] Failed to downgrade customer ${customerId}:`, dbError.message)
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}

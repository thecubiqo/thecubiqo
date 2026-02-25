import Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Lazy-initialize supabase admin client to avoid module-level errors when env vars are absent at build time
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return NextResponse.json({ error: err.message }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const session = event.data.object as Stripe.Checkout.Session

    switch (event.type) {
        case 'checkout.session.completed':
            if (session.subscription) {
                // Retrieve the subscription details to extract the plan
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
                const priceId = subscription.items.data[0].price.id

                await supabaseAdmin
                    .from('user_subscriptions')
                    .upsert({
                        user_id: session.metadata?.supabaseUUID,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscription.id,
                        stripe_price_id: priceId,
                        status: subscription.status,
                        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end
                    })

                await supabaseAdmin
                    .from('profiles')
                    .update({ is_pro: true })
                    .eq('id', session.metadata?.supabaseUUID)
            }
            break
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscriptionInfo = event.data.object as Stripe.Subscription
            const priceId = subscriptionInfo.items.data[0].price.id

            await supabaseAdmin
                .from('user_subscriptions')
                .upsert({
                    user_id: subscriptionInfo.metadata?.supabaseUUID, // Need to make sure this exists
                    stripe_customer_id: subscriptionInfo.customer as string,
                    stripe_subscription_id: subscriptionInfo.id,
                    stripe_price_id: priceId,
                    status: subscriptionInfo.status,
                    current_period_end: new Date((subscriptionInfo as any).current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscriptionInfo.cancel_at_period_end
                })

            if (subscriptionInfo.status !== 'active' && subscriptionInfo.status !== 'trialing') {
                // Try to look up mapping from customer id to user id, if missing
                const { data: sub } = await supabaseAdmin
                    .from('user_subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', subscriptionInfo.customer as string)
                    .single()

                if (sub?.user_id) {
                    await supabaseAdmin
                        .from('profiles')
                        .update({ is_pro: false })
                        .eq('id', sub.user_id)
                }
            } else if (subscriptionInfo.status === 'active' || subscriptionInfo.status === 'trialing') {
                const { data: sub } = await supabaseAdmin
                    .from('user_subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', subscriptionInfo.customer as string)
                    .single()

                if (sub?.user_id) {
                    await supabaseAdmin
                        .from('profiles')
                        .update({ is_pro: true })
                        .eq('id', sub.user_id)
                }
            }
            break
        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
}

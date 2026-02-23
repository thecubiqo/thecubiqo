import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ENV } from '@/lib/config/env'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-01-27.acacia' as any
})

export async function POST(req: NextRequest) {
    try {
        const { tier } = await req.json()
        const cookieStore = await cookies()

        const supabase = createServerClient(
            ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            ENV.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value)) },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { origin } = new URL(req.url)

        // Determine price ID from tier
        let priceId = ''
        if (tier === 'pro') {
            priceId = process.env.STRIPE_PRICE_ID_PRO || 'price_1QxBygA3a2F2sWnC3k3bL2mO'
        } else if (tier === 'commander') {
            priceId = process.env.STRIPE_PRICE_ID_COMMANDER || 'price_1QxBzNA3a2F2sWnCYd0B0S9v'
        } else {
            return NextResponse.json({ error: 'Invalid tier specified' }, { status: 400 })
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
            customer_email: user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing`,
            client_reference_id: user.id, // CRITICAL: This links the checkout back to our Supabase user
            metadata: {
                tier_id: tier
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { priceId } = await req.json()
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profileRaw } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        const profile = profileRaw as any

        let customerId = profile?.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email || profile?.email,
                metadata: {
                    supabaseUUID: user.id
                }
            })
            customerId = customer.id

            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId } as any)
                .eq('id', user.id)
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cubikey?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cubikey?canceled=true`,
            metadata: {
                supabaseUUID: user.id
            }
        })

        return NextResponse.json({ sessionId: session.id })
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
            { error: 'Error creating checkout session' },
            { status: 500 }
        )
    }
}

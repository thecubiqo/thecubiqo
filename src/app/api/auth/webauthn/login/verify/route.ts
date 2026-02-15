import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatorByCredentialId, updateAuthenticatorCounter, getSupabaseAdmin } from '@/lib/webauthn'

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

export async function POST(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const expectedChallenge = request.cookies.get('webauthn_challenge')?.value

    if (!expectedChallenge) {
        return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 })
    }

    // 1. Find authenticator by ID
    const credentialId = body.id
    const authenticator = await getAuthenticatorByCredentialId(credentialId)

    if (!authenticator) {
        return NextResponse.json({ error: 'Authenticator not found' }, { status: 401 })
    }

    // 2. Verify
    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: authenticator.credential_id, // string
                publicKey: new Uint8Array(Buffer.from(authenticator.credential_public_key, 'base64url')), // string -> Uint8Array
                counter: authenticator.counter,
                transports: authenticator.transports as any,
            },
            requireUserVerification: false,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { verified, authenticationInfo } = verification

    if (verified && authenticationInfo) {
        // 3. Update counter
        await updateAuthenticatorCounter(authenticator.credential_id, authenticationInfo.newCounter)

        // 4. Log the user in (Generate Magic Link)
        const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(authenticator.user_id)
        const user = data?.user

        if (userError || !user || !user.email) {
            return NextResponse.json({ error: 'User not found' }, { status: 500 })
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
        })

        if (linkError || !linkData?.properties?.action_link) {
            return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 })
        }

        const response = NextResponse.json({ verified: true, redirectUrl: linkData.properties.action_link })
        response.cookies.delete('webauthn_challenge')
        return response
    }

    return NextResponse.json({ verified: false }, { status: 400 })
}

import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { saveAuthenticator } from '@/lib/webauthn'

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const expectedChallenge = request.cookies.get('webauthn_challenge')?.value

    if (!expectedChallenge) {
        return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 })
    }

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { verified, registrationInfo } = verification

    if (verified && registrationInfo) {
        const { credential } = registrationInfo

        // Helper to encode array buffer to base64url
        const toBase64Url = (buffer: Uint8Array) => {
            return Buffer.from(buffer).toString('base64url')
        }

        try {
            await saveAuthenticator({
                user_id: user.id,
                credential_id: credential.id, // v13: string (Base64URL)
                credential_public_key: toBase64Url(credential.publicKey), // v13: Uint8Array -> string
                counter: credential.counter,
                transports: body.response.transports || [],
            })
        } catch (e) {
            console.error('Failed to save authenticator', e)
            return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 })
        }

        const response = NextResponse.json({ verified: true })
        response.cookies.delete('webauthn_challenge')
        return response
    }

    return NextResponse.json({ verified: false, error: 'Verification returned false' }, { status: 400 })
}

import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserAuthenticators } from '@/lib/webauthn'
import { getRPID, RP_NAME } from '@/lib/webauthn/config'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get RP ID dynamically based on request origin
    const rpID = getRPID(request)

    // Get existing authenticators to prevent re-registration
    const userAuthenticators = await getUserAuthenticators(user.id)

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpID,
        userID: new TextEncoder().encode(user.id), // Must be unique bytes
        userName: user.email || user.id,
        attestationType: 'none', // 'none' is recommended for privacy and compatibility
        excludeCredentials: userAuthenticators.map(authenticator => ({
            id: authenticator.credential_id, // simplewebauthn handles base64url decoding if needed, but here it expects string? No, existing credentials.
            // Actually usually transport is needed too
            transports: (authenticator.transports as any) || undefined,
        })),
        authenticatorSelection: {
            residentKey: 'preferred', // 'required' for passwordless (discoverable credentials)
            userVerification: 'preferred',
            authenticatorAttachment: 'platform', // Enforce platform authenticator (TouchID/FaceID)
        },
    })

    // Save the challenge to session/cookie to verify later
    // Supabase doesn't give us easy session storage for custom data securely on server unless we use a cookie.
    // We will set a HTTP-only cookie signed.
    const response = NextResponse.json(options)
    response.cookies.set('webauthn_challenge', options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 5 // 5 minutes
    })

    return response
}

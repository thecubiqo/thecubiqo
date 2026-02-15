import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserAuthenticators } from '@/lib/webauthn'

// Mark as dynamic to skip during build\nexport const dynamic = 'force-dynamic'\n

const RP_NAME = 'CubiQo'
const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing authenticators to prevent re-registration
    const userAuthenticators = await getUserAuthenticators(user.id)

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
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

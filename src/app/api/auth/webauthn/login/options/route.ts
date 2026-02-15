import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { NextRequest, NextResponse } from 'next/server'

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'

// Mark as dynamic to skip during build\nexport const dynamic = 'force-dynamic'\n

export async function GET(request: NextRequest) {
    // We utilize "Discoverable Credentials" (Usernameless flow).
    // We do not pass 'allowCredentials' by default. 
    // If the user entered an email, we could look up their credentials, but the "Sign in with Passkey"
    // button usually implies checking the device first.

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'preferred',
    })

    // Save challenge
    const response = NextResponse.json(options)
    response.cookies.set('webauthn_challenge', options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/', // accessible to verify route
        maxAge: 60 * 5 // 5 minutes
    })

    return response
}

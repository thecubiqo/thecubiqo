import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRPID } from '@/lib/webauthn/config'

export async function GET(request: NextRequest) {
    // We utilize "Discoverable Credentials" (Usernameless flow).
    // We do not pass 'allowCredentials' by default. 
    // If the user entered an email, we could look up their credentials, but the "Sign in with Passkey"
    // button usually implies checking the device first.

    // Get RP ID dynamically based on request origin
    const rpID = getRPID(request)

    const options = await generateAuthenticationOptions({
        rpID: rpID,
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

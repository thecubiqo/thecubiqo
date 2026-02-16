/**
 * WebAuthn Configuration Helper
 * Dynamically determines Relying Party (RP) ID based on environment
 */

/**
 * Get the Relying Party ID for WebAuthn
 * @param request - Optional NextRequest to extract origin from headers
 * @returns The appropriate RP ID for the current domain
 */
export function getRPID(request?: Request): string {
    // Priority 1: Environment variable override
    if (process.env.NEXT_PUBLIC_RP_ID) {
        return process.env.NEXT_PUBLIC_RP_ID
    }

    // Priority 2: Extract from request origin (server-side)
    if (request) {
        const origin = request.headers.get('origin') || request.headers.get('host')
        if (origin) {
            try {
                const url = new URL(origin.startsWith('http') ? origin : `https://${origin}`)
                return url.hostname
            } catch {
                // Fall through to default
            }
        }
    }

    // Priority 3: Environment-based defaults
    if (process.env.VERCEL_URL) {
        return process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    }

    if (process.env.NODE_ENV === 'production') {
        return 'cubiqo.ai' // Production default
    }

    // Priority 4: Development default
    return 'localhost'
}

/**
 * Get the Relying Party origin for WebAuthn
 * @param request - Optional NextRequest to extract origin from headers
 * @returns The full origin URL
 */
export function getRPOrigin(request?: Request): string {
    const rpID = getRPID(request)

    // localhost needs http, everything else uses https
    if (rpID === 'localhost' || rpID.startsWith('localhost:')) {
        return `http://${rpID}`
    }

    return `https://${rpID}`
}

/**
 * Relying Party Name
 */
export const RP_NAME = 'CubiQo'

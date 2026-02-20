// Proxy file for Next.js compatibility
// Wraps the middleware function for proxy compatibility

import { NextRequest, NextResponse } from 'next/server'
import { middleware } from './middleware'

// Export the middleware function as proxy
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return middleware(request)
}

// Also export as default for compatibility
export default proxy

// Export the config from middleware
export { config } from './middleware'
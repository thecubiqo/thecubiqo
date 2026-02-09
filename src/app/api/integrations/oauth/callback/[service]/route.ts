/**
 * OAuth Callback Handler - MOCK MODE
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params
  const redirectUrl = new URL('/integrations', request.url)
  redirectUrl.searchParams.set('connected', service)
  redirectUrl.searchParams.set('mock', 'true')
  return NextResponse.redirect(redirectUrl)
}

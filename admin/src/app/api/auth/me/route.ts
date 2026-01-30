import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }

  const session = verifySessionToken(token)

  if (!session || !session.authenticated) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
  })
}


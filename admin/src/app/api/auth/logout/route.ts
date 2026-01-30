import { NextResponse } from 'next/server'

// POST /api/auth/logout - Logout endpoint
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('auth-token')
  return response
}


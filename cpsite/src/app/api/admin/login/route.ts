import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json() as { password?: string }
  if (body.password && body.password === process.env.ADMIN_TOKEN) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('cpsite_admin', process.env.ADMIN_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

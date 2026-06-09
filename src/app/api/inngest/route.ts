import { NextRequest, NextResponse } from 'next/server';
import { inngestFunctions } from '@/next/lib/inngest/duo-agent';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ app: 'cubiqo', functions: inngestFunctions.map(fn => ({ id: fn.id, name: fn.name })) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true, received: body, functions: inngestFunctions.length });
}

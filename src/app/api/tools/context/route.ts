export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { extractContext, extractContextFromUrl } from '../../_lib/context-engine';

export async function POST(request: NextRequest) {
  const authError = await requireApiUser(request);
  if (authError) return authError;

  let body: { text?: string; url?: string; goal?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, url, goal } = body;

  if (!text && !url) {
    return NextResponse.json(
      { error: 'Provide either "text" or "url" in the request body.' },
      { status: 400 },
    );
  }

  try {
    if (url) {
      const context = await extractContextFromUrl(url);
      return NextResponse.json({ context });
    }

    const context = await extractContext(text!, goal);
    return NextResponse.json({ context });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

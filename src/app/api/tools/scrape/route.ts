import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { scrapeUrl, scrapeMultiple } from '../../_lib/content-scraper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const { url, urls } = body as { url?: string; urls?: string[] };

  if (url) {
    const result = await scrapeUrl(String(url));
    return NextResponse.json({ result });
  }

  if (Array.isArray(urls) && urls.length) {
    const capped = urls.slice(0, 5).map(String);
    const results = await scrapeMultiple(capped);
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Provide url (string) or urls (array)' }, { status: 400 });
}

// API: Preview mode - set/clear preview overrides
import { NextRequest, NextResponse } from 'next/server';
import { serializePreviewCookie, generatePreviewLink } from '@/lib/founders-pass/preview';
import { listFlags } from '@/lib/founders-pass/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteSlug = searchParams.get('siteSlug');
    const enabledKeys = searchParams.get('enabledKeys')?.split(',').filter(Boolean) ?? [];

    if (!siteSlug) {
      return NextResponse.json({ error: 'siteSlug required' }, { status: 400 });
    }

    const flags = await listFlags();
    const previewUrl = generatePreviewLink(siteSlug, flags, enabledKeys);
    return NextResponse.json({ previewUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const overrides: Record<string, boolean> = body.overrides ?? {};
    const cookieValue = serializePreviewCookie(overrides);

    const response = NextResponse.json({ success: true, overrides });
    response.cookies.set('fp_preview', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('fp_preview');
  return response;
}

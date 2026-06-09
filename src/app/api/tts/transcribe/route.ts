import { NextRequest, NextResponse } from 'next/server';
import { shouldUseProviderMock } from '@/next/lib/providers/live-provider-guard';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (shouldUseProviderMock()) {
    return NextResponse.json({ text: 'Mock transcription', provider: 'mock' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Transcription provider not configured' }, { status: 501 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file required' }, { status: 400 });

  const upstream = new FormData();
  upstream.set('file', file);
  upstream.set('model', 'whisper-1');
  const language = formData.get('language');
  if (typeof language === 'string' && language) upstream.set('language', language);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });
  if (!res.ok) return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
  return NextResponse.json(await res.json());
}

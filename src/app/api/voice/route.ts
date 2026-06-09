import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextRequest } from 'next/server';
import { getBearerToken, getSupabaseAdmin } from '../_lib/supabase-admin';
import { guardPermission } from '@/next/lib/agent/permission-guard';

export const maxDuration = 30;
export const runtime = 'nodejs';

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'SAz9YHcvj6GT2YYXdXww'; // River

// POST /api/voice?mode=stt  — body: { audio: base64string, mimeType?: string }
// POST /api/voice?mode=tts  — body: { text: string }
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'tts';

  // ── Permission gates ───────────────────────────────────────────────────────
  // STT: requires mic permission (user must have granted mic access)
  // TTS: no gate — playback doesn't require mic permission
  if (mode === 'stt') {
    const supabase = getSupabaseAdmin();
    const token = getBearerToken(request);
    let userId: string | null = null;
    if (supabase && token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }
    // Only enforce for authenticated users (anonymous STT is allowed but untracked)
    if (userId) {
      const denied = await guardPermission(supabase, userId, 'mic');
      if (denied) return denied;
    }
  }

  if (mode === 'stt') {
    const { audio, mimeType = 'audio/webm' } = await request.json();
    const audioBuffer = Buffer.from(audio, 'base64');

    // Deepgram prerecorded REST API (v5 SDK removed this method; REST is direct + stable)
    const dgRes = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&language=en',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': mimeType,
        },
        body: audioBuffer,
      }
    );

    if (!dgRes.ok) {
      const err = await dgRes.text();
      return Response.json({ error: `Deepgram error: ${err}` }, { status: 502 });
    }

    const data = await dgRes.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    return Response.json({ transcript });
  }

  // TTS — Text → Speech via ElevenLabs SDK
  const { text } = await request.json();
  if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 });

  const audioStream = await elevenlabs.textToSpeech.stream(VOICE_ID, {
    text,
    modelId: 'eleven_flash_v2_5',
    outputFormat: 'mp3_44100_128',
    voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
  });

  const chunks: Buffer[] = [];
  const reader = audioStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

const FALLBACK_VOICE_ID = 'SAz9YHcvj6GT2YYXdXww';
const FALLBACK_MODEL_ID = 'eleven_flash_v2_5';
const LISTENING_CUE_TEXT = 'I am listening.';

// Surreal neutral voice settings — same defaults as /api/tts
const VOICE_SETTINGS = {
  stability: 0.76,
  similarity_boost: 0.58,
  style: 0.05,
  speed: 0.92,
  use_speaker_boost: false,
};

function getApiKey() {
  for (const key of ['ELEVENLABS_API_KEY', 'ELEVEN_LABS_API_KEY', 'ELEVENLABS_KEY', 'XI_API_KEY']) {
    const v = (process.env[key] || '').trim();
    if (v) return v;
  }
  return '';
}

async function generateListeningCue(): Promise<NextResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ audio_url: null, error: 'No ElevenLabs key configured' });
  }

  const voiceId =
    process.env.ELEVENLABS_VOICE_ID ||
    process.env.ELEVEN_LABS_VOICE_ID ||
    FALLBACK_VOICE_ID;
  const modelId =
    process.env.ELEVENLABS_MODEL_ID ||
    process.env.ELEVEN_LABS_MODEL_ID ||
    FALLBACK_MODEL_ID;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: LISTENING_CUE_TEXT,
        model_id: modelId,
        voice_settings: VOICE_SETTINGS,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return NextResponse.json({
        audio_url: null,
        error: `ElevenLabs HTTP ${res.status}: ${err.slice(0, 120)}`,
      });
    }

    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ audio_url: `data:audio/mpeg;base64,${b64}` });
  } catch (err: any) {
    return NextResponse.json({ audio_url: null, error: err?.message || 'Voice cue failed' });
  }
}

export async function POST(_request: NextRequest) {
  return generateListeningCue();
}

export async function GET(_request: NextRequest) {
  return generateListeningCue();
}

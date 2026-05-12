import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../_lib/supabase-admin';
import { getVoicePlatformDefaults } from '../_lib/platform-settings';

export const runtime = 'nodejs';
export const maxDuration = 15;

const FALLBACK_VOICE_ID = 'SAz9YHcvj6GT2YYXdXww';
const FALLBACK_MODEL_ID = 'eleven_flash_v2_5';

function getApiKey() {
  for (const key of ['ELEVENLABS_API_KEY', 'ELEVEN_LABS_API_KEY', 'ELEVENLABS_KEY', 'XI_API_KEY']) {
    const v = (process.env[key] || '').trim();
    if (v) return v;
  }
  return '';
}

function voiceSettings(color?: string) {
  if (color === 'green')
    return { stability: 0.70, similarity_boost: 0.60, style: 0.08, speed: 0.94, use_speaker_boost: false };
  if (color === 'red')
    return { stability: 0.82, similarity_boost: 0.56, style: 0.02, speed: 0.90, use_speaker_boost: false };
  return   { stability: 0.76, similarity_boost: 0.58, style: 0.05, speed: 0.92, use_speaker_boost: false };
}

async function resolveVoiceConfig() {
  const admin = getSupabaseAdmin();
  const settings = admin ? await getVoicePlatformDefaults(admin).catch(() => null) : null;
  return {
    voiceId: process.env.ELEVENLABS_VOICE_ID || process.env.ELEVEN_LABS_VOICE_ID || settings?.elevenLabsVoiceId || FALLBACK_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID || process.env.ELEVEN_LABS_MODEL_ID || settings?.elevenLabsModelId || FALLBACK_MODEL_ID
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, 500);
  const color = String(body.color || 'yellow');

  const apiKey = getApiKey();
  if (!apiKey) return NextResponse.json({ audio_url: null, error: 'No ElevenLabs key configured' });
  if (!text)   return NextResponse.json({ audio_url: null, error: 'No text provided' });

  try {
    const voiceConfig = await resolveVoiceConfig();
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: voiceConfig.modelId, voice_settings: voiceSettings(color) }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return NextResponse.json({ audio_url: null, error: `ElevenLabs HTTP ${res.status}: ${err.slice(0, 120)}` });
    }

    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ audio_url: `data:audio/mpeg;base64,${b64}` });
  } catch (err: any) {
    return NextResponse.json({ audio_url: null, error: err.message || 'TTS failed' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getBearerToken, getSupabaseAdmin } from '../_lib/supabase-admin';
import { getVoicePlatformDefaults } from '../_lib/platform-settings';
import { shouldUseProviderMock } from '@/next/lib/providers/live-provider-guard';

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

/**
 * Voice settings per RGY mode — CubiQo-AV-Personality.md §Four Voice States.
 *   Neutral: calm, present, slightly curious — measured pace (default).
 *   GREEN  : energetic, forward-moving — slightly faster pace.
 *   RED    : deliberate, steady, grounding — slower, counter-tones user.
 *   YELLOW : gentle, inviting, playful — slowest, counter-tones high-energy.
 * What changes: stability (consistency), style (expressiveness), speed.
 * What does NOT change: similarity_boost stays close to the canonical voice.
 */
function voiceSettings(color?: string) {
  const c = String(color || 'neutral').toLowerCase();
  // All speeds reduced ~10% from prior generation per UX feedback —
  // CubiQo should feel relaxed and present, never rushed.
  if (c === 'green')
    return { stability: 0.74, similarity_boost: 0.62, style: 0.07, speed: 0.92, use_speaker_boost: false };
  if (c === 'red')
    return { stability: 0.86, similarity_boost: 0.58, style: 0.02, speed: 0.80, use_speaker_boost: false };
  if (c === 'yellow')
    return { stability: 0.82, similarity_boost: 0.60, style: 0.05, speed: 0.80, use_speaker_boost: false };
  // neutral / default
  return   { stability: 0.80, similarity_boost: 0.60, style: 0.03, speed: 0.86, use_speaker_boost: false };
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
  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);

  if (!token || !supabase) {
    return NextResponse.json({ audio_url: null, error: 'Auth required' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.id) {
    return NextResponse.json({ audio_url: null, error: 'Invalid session' }, { status: 401 });
  }
  const apiKey = getApiKey();
  if (shouldUseProviderMock()) {
    return NextResponse.json({ audio_url: null, mocked: true, error: 'ElevenLabs mocked for tests' });
  }
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
    getSupabaseAdmin()?.from('api_usage_events').insert({
      route: '/api/tts',
      provider: 'elevenlabs',
      model: voiceConfig.modelId,
      units_used: text.length,
      unit_type: 'characters',
      latency_ms: Date.now() - startedAt
    }).then(() => null);
    return NextResponse.json({ audio_url: `data:audio/mpeg;base64,${b64}` });
  } catch (err: any) {
    return NextResponse.json({ audio_url: null, error: err.message || 'TTS failed' });
  }
}

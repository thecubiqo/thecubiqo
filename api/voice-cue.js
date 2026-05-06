const https = require('https');

function cleanEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\r\\n$/g, '')
    .replace(/\\n$/g, '')
    .trim();
}

function readEnv(names) {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return { value, name };
  }
  return { value: '', name: null };
}

const ELEVENLABS_ENV = readEnv(['ELEVENLABS_API_KEY', 'ELEVEN_LABS_API_KEY', 'ELEVENLABS_KEY', 'ELEVEN_LABS_KEY', 'XI_API_KEY']);
const VOICE_ENV = readEnv(['ELEVENLABS_VOICE_ID', 'ELEVEN_LABS_VOICE_ID', 'VOICE_ID']);
const ELEVENLABS_KEY = ELEVENLABS_ENV.value;
const ELEVENLABS_VOICE_ID = VOICE_ENV.value || 'SAz9YHcvj6GT2YYXdXww';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || process.env.ELEVEN_LABS_MODEL_ID || 'eleven_flash_v2_5';

const CUES = {
  listening: 'I am listening.'
};

function synthesizeCue(text) {
  if (!ELEVENLABS_KEY) return Promise.resolve({ audioUrl: null, error: 'No ElevenLabs key' });

  return new Promise((resolve) => {
    const body = JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: {
        stability: 0.72,
        similarity_boost: 0.62,
        style: 0.08,
        speed: 0.92,
        use_speaker_boost: false
      }
    });

    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const b64 = Buffer.concat(chunks).toString('base64');
          resolve({ audioUrl: `data:audio/mpeg;base64,${b64}`, error: null });
        } else {
          resolve({ audioUrl: null, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => resolve({ audioUrl: null, error: error.message }));
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cue = String(req.body?.cue || 'listening').toLowerCase();
    const text = CUES[cue];
    if (!text) return res.status(400).json({ error: 'Unknown cue' });

    const audio = await synthesizeCue(text);
    return res.status(200).json({
      cue,
      text,
      audio_url: audio.audioUrl,
      provider: audio.audioUrl ? 'elevenlabs' : 'none',
      error: audio.error
    });
  } catch (error) {
    return res.status(500).json({ error: 'Voice cue failed' });
  }
};

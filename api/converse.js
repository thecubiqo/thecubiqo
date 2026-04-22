const https = require('https');

// AI model orchestration - OpenAI -> Anthropic -> OpenRouter
function readEnv(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return { value: value.trim().replace(/^['"]|['"]$/g, ''), name };
    }
  }
  return { value: '', name: null };
}

const ANTHROPIC_ENV = readEnv(['ANTHROPIC_API_KEY', 'ANTHROPIC_KEY', 'CLAUDE_API_KEY', 'CLAUDE_KEY']);
const OPENAI_ENV = readEnv(['OPENAI_API_KEY', 'OPENAI_KEY', 'AI_API_KEY']);
const OPENROUTER_ENV = readEnv(['OPENROUTER_API_KEY', 'OPENROUTER_KEY']);
const ELEVENLABS_ENV = readEnv(['ELEVENLABS_API_KEY', 'ELEVEN_LABS_API_KEY', 'ELEVENLABS_KEY', 'ELEVEN_LABS_KEY', 'XI_API_KEY']);
const VOICE_ENV = readEnv(['ELEVENLABS_VOICE_ID', 'ELEVEN_LABS_VOICE_ID', 'VOICE_ID']);

const ANTHROPIC_KEY = ANTHROPIC_ENV.value;
const OPENAI_KEY = OPENAI_ENV.value;
const OPENROUTER_KEY = OPENROUTER_ENV.value;
const ELEVENLABS_KEY = ELEVENLABS_ENV.value;
const ELEVENLABS_VOICE_ID = VOICE_ENV.value || '21m00Tcm4TlvDq8ikWAM'; // Rachel
const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-5.4';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || process.env.ELEVEN_LABS_MODEL_ID || 'eleven_flash_v2_5';
const DEFAULT_PROVIDER_ORDER = ['openai', 'anthropic', 'openrouter'];
const PROVIDER_ORDER = parseProviderOrder(process.env.PROVIDER_ORDER);

const SYSTEM_PROMPT = `You are CubiQo — a philosophical, deeply intelligent AI assistant.
You speak with calm authority on any topic. 
For EVERY response, after your main reply, output a JSON block like:
<keywords>{"green": ["potential1","potential2"], "yellow": ["activity1"], "red": ["wish1"]}</keywords>
Green = Potentials (growth, future), Yellow = Activities (current actions), Red = Wishes (deep desires).
Keywords should be nouns or adjectives defining the user's wishes or potentials.
Keep your main response under 3 sentences. Be profound but concise.`;

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callClaude(message, history, context) {
  if (!ANTHROPIC_KEY) throw new Error('No Anthropic key');
  const messages = [...(history || []).slice(-8)];
  const userContent = context ? `${context}\n\n${message}` : message;
  messages.push({ role: 'user', content: userContent });

  const raw = await httpsPost(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 512, system: SYSTEM_PROMPT, messages })
  );
  return [JSON.parse(raw).content[0].text, ANTHROPIC_MODEL];
}

function normalizeProviderName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  if (['claude', 'anthropic'].includes(normalized)) return 'anthropic';
  if (['gpt', 'openai'].includes(normalized)) return 'openai';
  if (['router', 'openrouter'].includes(normalized)) return 'openrouter';
  return normalized;
}

function parseProviderOrder(value) {
  const requested = String(value || '')
    .split(',')
    .map(normalizeProviderName)
    .filter(Boolean);
  const ordered = [];
  for (const provider of [...requested, ...DEFAULT_PROVIDER_ORDER]) {
    if (DEFAULT_PROVIDER_ORDER.includes(provider) && !ordered.includes(provider)) {
      ordered.push(provider);
    }
  }
  return ordered;
}

function parseHttpStatus(error) {
  const match = String(error?.message || error || '').match(/HTTP\s+(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function classifyProviderError(error) {
  const status = parseHttpStatus(error);
  const text = String(error?.message || error || '').toLowerCase();
  const policySignals = ['content_policy', 'policy_violation', 'safety', 'safeguard', 'disallowed', 'unsafe content'];

  if (policySignals.some(signal => text.includes(signal))) {
    return { category: 'safety', retryable: false, status };
  }
  if (status === 401 || status === 403) {
    return { category: 'auth', retryable: false, status };
  }
  if (status === 402) {
    return { category: 'billing', retryable: false, status };
  }
  if (status === 408 || status === 409 || status === 425 || status === 429) {
    return { category: status === 429 ? 'rate_limit' : 'transient', retryable: true, status };
  }
  if (status >= 500) {
    return { category: 'provider_unavailable', retryable: true, status };
  }
  if (status === 400 || status === 404) {
    return { category: 'request_or_model', retryable: false, status };
  }
  if (['timeout', 'econnreset', 'enotfound', 'socket hang up', 'network'].some(signal => text.includes(signal))) {
    return { category: 'network', retryable: true, status };
  }
  return { category: 'unknown', retryable: true, status };
}

async function callOpenAI(message, history, context) {
  if (!OPENAI_KEY) throw new Error('No OpenAI key');
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(history || []).slice(-8)];
  const userContent = context ? `${context}\n\n${message}` : message;
  messages.push({ role: 'user', content: userContent });

  const raw = await httpsPost(
    'https://api.openai.com/v1/chat/completions',
    { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    JSON.stringify({ model: OPENAI_MODEL, max_tokens: 512, messages })
  );
  return [JSON.parse(raw).choices[0].message.content, OPENAI_MODEL];
}

async function callOpenRouter(message, history, context) {
  if (!OPENROUTER_KEY) throw new Error('No OpenRouter key');
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(history || []).slice(-8)];
  const userContent = context ? `${context}\n\n${message}` : message;
  messages.push({ role: 'user', content: userContent });

  const raw = await httpsPost(
    'https://openrouter.ai/api/v1/chat/completions',
    { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
    JSON.stringify({ model: OPENROUTER_MODEL, max_tokens: 512, messages })
  );
  return [JSON.parse(raw).choices[0].message.content, OPENROUTER_MODEL];
}

async function searchWeb(query) {
  return new Promise((resolve) => {
    const urlObj = new URL('https://api.duckduckgo.com/');
    urlObj.searchParams.set('q', query);
    urlObj.searchParams.set('format', 'json');
    urlObj.searchParams.set('no_html', '1');
    urlObj.searchParams.set('skip_disambig', '1');

    https.get(urlObj.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.AbstractText || (json.RelatedTopics?.[0]?.Text) || '';
          resolve(text ? `[Web context]: ${text.slice(0, 400)}` : '');
        } catch { resolve(''); }
      });
    }).on('error', () => resolve(''));
  });
}

function needsWebSearch(text) {
  const triggers = ['today', 'current', 'latest', 'news', '2025', '2026', 'weather', 'stock', 'price', 'who is', 'when did', 'what happened', 'real-time', 'now', 'happening'];
  const lower = text.toLowerCase();
  return triggers.some(t => lower.includes(t));
}

function extractKeywords(text) {
  const match = text.match(/<keywords>([\s\S]*?)<\/keywords>/);
  if (match) {
    try { return JSON.parse(match[1]); } catch {}
  }
  return { green: [], yellow: [], red: [] };
}

function cleanResponse(text) {
  return text.replace(/<keywords>[\s\S]*?<\/keywords>/g, '').trim();
}

function isSafetyRefusal(text) {
  const lower = String(text || '').toLowerCase();
  const refusalSignals = [
    "i can't assist",
    'i cannot assist',
    "i can't help",
    'i cannot help',
    "i won't help",
    'i will not help',
    'unable to help'
  ];
  const safetySignals = [
    'policy',
    'safety',
    'unsafe',
    'illegal',
    'harmful',
    'sexual content',
    'minor',
    'self-harm',
    'hate',
    'weapon',
    'disallowed'
  ];
  return refusalSignals.some(signal => lower.includes(signal)) && safetySignals.some(signal => lower.includes(signal));
}

function publicError(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-key]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted-key]')
    .slice(0, 220);
}

function buildLocalFallback(message) {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'with', 'from', 'this', 'that', 'have', 'your', 'about', 'into'].includes(word));

  const unique = [...new Set(words)].slice(0, 9);
  const topic = unique[0] || 'this';

  return {
    response: `I am here. I caught the signal around ${topic}; say a little more and I will help shape it into a clearer next move.`,
    keywords: {
      green: unique.slice(0, 3),
      yellow: unique.slice(3, 6),
      red: unique.slice(6, 9)
    }
  };
}

function buildSafetyResponse(message) {
  const fallback = buildLocalFallback(message);
  return {
    response: "I can't help with that request, but I can help reframe it into something safe, legal, and useful.",
    keywords: {
      green: fallback.keywords.green,
      yellow: ['reframe', 'boundary'],
      red: ['risk']
    }
  };
}

function getProviderSequence() {
  const registry = {
    openai: { name: 'openai', configured: Boolean(OPENAI_KEY), envName: OPENAI_ENV.name, fn: callOpenAI },
    anthropic: { name: 'anthropic', configured: Boolean(ANTHROPIC_KEY), envName: ANTHROPIC_ENV.name, fn: callClaude },
    openrouter: { name: 'openrouter', configured: Boolean(OPENROUTER_KEY), envName: OPENROUTER_ENV.name, fn: callOpenRouter }
  };
  return PROVIDER_ORDER.map(provider => registry[provider]).filter(Boolean);
}

async function generateElevenLabsAudio(text) {
  if (!ELEVENLABS_KEY) return { audioUrl: null, error: 'No ElevenLabs key' };
  return new Promise((resolve) => {
    const body = JSON.stringify({
      text: text.slice(0, 500),
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    });
    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const chunks = [];
    const req = https.request(options, (res) => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const b64 = Buffer.concat(chunks).toString('base64');
          resolve({ audioUrl: `data:audio/mpeg;base64,${b64}`, error: null });
        } else {
          const errorText = Buffer.concat(chunks).toString('utf8').slice(0, 220);
          resolve({ audioUrl: null, error: `HTTP ${res.statusCode}: ${errorText}` });
        }
      });
    });
    req.on('error', (error) => resolve({ audioUrl: null, error: publicError(error) }));
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const attempts = [];

  try {
    // Web search if needed
    let context = '';
    if (needsWebSearch(message)) {
      context = await searchWeb(message);
    }

    // Orchestrate providers. Operational failures fall through; safety refusals do not.
    let rawResponse = '', modelUsed = 'fallback';
    let safetyStop = false;
    for (const { name, configured, envName, fn } of getProviderSequence()) {
      if (!configured) {
        attempts.push({ provider: name, configured, env: envName, ok: false, category: 'missing_key', retryable: false });
        continue;
      }

      try {
        [rawResponse, modelUsed] = await fn(message, history, context);
        if (!String(rawResponse || '').trim()) {
          attempts.push({ provider: name, configured, env: envName, ok: false, category: 'empty_response', retryable: true });
          rawResponse = '';
          continue;
        }

        if (isSafetyRefusal(rawResponse)) {
          attempts.push({ provider: name, configured, env: envName, ok: true, safety_refusal: true });
          safetyStop = true;
        } else {
          attempts.push({ provider: name, configured, env: envName, ok: true });
        }
        break;
      } catch (e) {
        const errorInfo = classifyProviderError(e);
        attempts.push({ provider: name, configured, env: envName, ok: false, ...errorInfo, error: publicError(e) });
        console.warn(`${fn.name} failed:`, e.message);
        if (errorInfo.category === 'safety') {
          const safety = buildSafetyResponse(message);
          rawResponse = safety.response;
          modelUsed = `${name}-safety`;
          safetyStop = true;
          break;
        }
      }
    }

    if (!rawResponse) {
      modelUsed = 'local-fallback';
    }

    let keywords = extractKeywords(rawResponse);
    let cleanText = cleanResponse(rawResponse);

    if (!cleanText) {
      const fallback = safetyStop ? buildSafetyResponse(message) : buildLocalFallback(message);
      cleanText = fallback.response;
      keywords = fallback.keywords;
      modelUsed = 'local-fallback';
    }

    // ElevenLabs TTS
    const audio = await generateElevenLabsAudio(cleanText);

    const payload = { response: cleanText, keywords, audio_url: audio.audioUrl, model_used: modelUsed };
    if (req.query?.diagnostics === '1' || req.body?.diagnostics === true) {
      payload.diagnostics = {
        env: {
          anthropic: { configured: Boolean(ANTHROPIC_KEY), name: ANTHROPIC_ENV.name, model: ANTHROPIC_MODEL },
          openai: { configured: Boolean(OPENAI_KEY), name: OPENAI_ENV.name, model: OPENAI_MODEL },
          openrouter: { configured: Boolean(OPENROUTER_KEY), name: OPENROUTER_ENV.name, model: OPENROUTER_MODEL },
          elevenlabs: { configured: Boolean(ELEVENLABS_KEY), name: ELEVENLABS_ENV.name, voice: ELEVENLABS_VOICE_ID, model: ELEVENLABS_MODEL_ID }
        },
        provider_order: PROVIDER_ORDER,
        attempts,
        tts: {
          configured: Boolean(ELEVENLABS_KEY),
          env: ELEVENLABS_ENV.name,
          ok: Boolean(audio.audioUrl),
          error: audio.error ? publicError(audio.error) : null
        }
      };
    }

    return res.status(200).json(payload);

  } catch (err) {
    console.error('Converse error:', err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
};

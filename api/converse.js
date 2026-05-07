const https = require('https');

// AI model orchestration - OpenAI -> Anthropic -> OpenRouter
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
    if (value) {
      return { value, name };
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
const ELEVENLABS_VOICE_ID = VOICE_ENV.value || 'SAz9YHcvj6GT2YYXdXww'; // River - neutral, calm, informative
const ELEVENLABS_VOICE_NAME = process.env.ELEVENLABS_VOICE_NAME || process.env.ELEVEN_LABS_VOICE_NAME || 'River neutral/androgynous';
const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-5.4';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || process.env.ELEVEN_LABS_MODEL_ID || 'eleven_flash_v2_5';
const DEFAULT_PROVIDER_ORDER = ['openai', 'anthropic', 'openrouter'];
const PROVIDER_ORDER = parseProviderOrder(process.env.PROVIDER_ORDER);

const RUNTIME_MANIFEST = {
  product: 'cq.ai / CubiQo QA',
  app_path: 'React frontend on Vercel with /api/converse serverless function',
  active_backend: 'Vercel Node.js function api/converse.js',
  inactive_backend_note: 'backend/server.py exists in the repo but is not the active QA/production route',
  primary_llm: 'Provider order is evaluated at request time',
  provider_order: PROVIDER_ORDER,
  voice: `ElevenLabs ${ELEVENLABS_VOICE_NAME} (${ELEVENLABS_MODEL_ID})`,
  headless_browser: 'Not wired in this QA deployment; UI should not claim it is connected',
  storage: 'Supabase auth/profile/RGY tables are provisioned'
};

function providerConfigured(provider) {
  return {
    openai: Boolean(OPENAI_KEY),
    anthropic: Boolean(ANTHROPIC_KEY),
    openrouter: Boolean(OPENROUTER_KEY)
  }[provider] || false;
}

function providerLabel(provider) {
  return {
    openai: `OpenAI ${OPENAI_MODEL}`,
    anthropic: `Anthropic ${ANTHROPIC_MODEL}`,
    openrouter: `OpenRouter ${OPENROUTER_MODEL}`
  }[provider] || provider;
}

function configuredProviderLabels() {
  return PROVIDER_ORDER.filter(providerConfigured).map(providerLabel);
}

function primaryRuntimeSummary() {
  const configured = configuredProviderLabels();
  if (!configured.length) {
    return 'Local fallback only; no hosted LLM provider key is configured';
  }
  return `${configured.join(' -> ')}; local fallback if provider authentication or SLA fails`;
}

function runtimeManifestSnapshot() {
  return {
    ...RUNTIME_MANIFEST,
    primary_llm: primaryRuntimeSummary(),
    configured_providers: configuredProviderLabels(),
    missing_providers: PROVIDER_ORDER.filter(provider => !providerConfigured(provider))
  };
}

const SYSTEM_PROMPT = `You are CubiQo — a philosophical, deeply intelligent AI assistant.
You speak with calm authority on any topic. 
For EVERY response, after your main reply, output a JSON block like:
<keywords>{"green": ["linkedin","career"], "yellow": ["instagram","friends"], "red": ["adult apps","explicit"]}</keywords>
RGY matching capsule = color + keyword + intent.
Green = productive/help-oriented user activity: LinkedIn, yoga, wellness, career, planning, building, writing, shipping, focus, growth, and professional vibe.
Yellow = casual/social/general activity: Facebook, Instagram, casual posting, checking in, reassurance, mood, friends, movies, and easy conversation.
Red = adult-gated or explicit contexts: Grindr, Tinder, hookup, NSFW, intimate, private dating, kink, fetish, and similar age-gated signals.
Intent is only Socialize, Collaborate, or Trade; suggest it only when obvious, and do not imply matching has happened.
Keywords should describe user activities and the nature of help the system is giving.
Keep your main response under 3 sentences. Be profound but concise.`;

const RGY_META = {
  green: {
    label: 'Goal',
    intent: 'goal_oriented',
    voice: 'professional_decisive',
    color: 'GREEN'
  },
  yellow: {
    label: 'Casual',
    intent: 'casual_general',
    voice: 'friendly',
    color: 'YELLOW'
  },
  red: {
    label: 'Age-gated',
    intent: 'explicit_goal_oriented',
    voice: 'discreet_low_volume',
    color: 'RED'
  }
};

const GOAL_TERMS = [
  'build', 'business', 'company', 'launch', 'strategy', 'plan', 'work', 'career',
  'health', 'wellness', 'focus', 'money', 'trade', 'collaborate', 'collaboration',
  'ship', 'design', 'code', 'learn', 'grow', 'goal', 'task', 'project', 'linkedin',
  'yoga', 'fitness', 'resume', 'interview', 'portfolio', 'networking', 'outreach',
  'proposal', 'draft', 'write', 'review', 'schedule', 'train', 'vibe'
];
const CASUAL_TERMS = [
  'facebook', 'fb', 'instagram', 'insta', 'thread', 'threads', 'post', 'story',
  'scroll', 'chat', 'comfort', 'casual', 'friend', 'friends', 'mood', 'vent',
  'reassure', 'reassurance', 'easy', 'laidback', 'laid-back', 'hang', 'social'
];
const RED_TERMS = [
  'explicit', 'adult', 'sex', 'porn', 'nsfw', 'hookup', 'fetish', 'kink', 'dating',
  'intimate', 'private', 'grindr', 'tinder', 'bumble', 'hinge', 'onlyfans',
  'escort', 'bdsm', 'sext', 'sexting'
];
const SOCIALIZE_TERMS = [
  'friend', 'friends', 'chat', 'coffee', 'movie', 'movies', 'hang', 'hangout',
  'hangouts', 'date', 'dating', 'party', 'social', 'meet', 'meetup', 'conversation'
];
const COLLABORATE_TERMS = [
  'build', 'collaborate', 'collaboration', 'study', 'practice', 'project', 'career',
  'interview', 'learn', 'train', 'plan', 'write', 'review', 'gym', 'yoga', 'journal',
  'launch', 'ship', 'code', 'design'
];
const TRADE_TERMS = [
  'buy', 'sell', 'trade', 'paid', 'service', 'services', 'marketplace', 'shop',
  'purchase', 'sale', 'coach', 'coaching', 'tutor', 'tutoring', 'offer', 'barter',
  'wallet', 'payment', 'stripe'
];
const SELF_HARM_TERMS = [
  'kill myself', 'suicide', 'self harm', 'self-harm', 'hurt myself', 'end my life',
  'want to die', 'cut myself'
];

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

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function normalizeKeyword(word) {
  return String(word || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .trim();
}

function uniqueLimited(words, limit = 10) {
  return [...new Set(words.map(normalizeKeyword).filter(Boolean))].slice(0, limit);
}

function classifyMessageKeywords(message) {
  const lower = String(message || '').toLowerCase();
  const tokens = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(normalizeKeyword)
    .filter(word => word.length > 2);

  const keywords = { green: [], yellow: [], red: [] };
  const scanTerms = (terms, color) => {
    terms.forEach(term => {
      if (lower.includes(term)) keywords[color].push(term);
    });
  };

  scanTerms(GOAL_TERMS, 'green');
  scanTerms(CASUAL_TERMS, 'yellow');
  scanTerms(RED_TERMS, 'red');

  tokens.forEach(word => {
    if (RED_TERMS.includes(word)) keywords.red.push(word);
    else if (GOAL_TERMS.includes(word)) keywords.green.push(word);
    else if (CASUAL_TERMS.includes(word)) keywords.yellow.push(word);
  });

  return {
    green: uniqueLimited(keywords.green),
    yellow: uniqueLimited(keywords.yellow),
    red: uniqueLimited(keywords.red)
  };
}

function mergeKeywords(primary = {}, fallback = {}) {
  return {
    green: uniqueLimited([...(primary.green || []), ...(fallback.green || [])]),
    yellow: uniqueLimited([...(primary.yellow || []), ...(fallback.yellow || [])]),
    red: uniqueLimited([...(primary.red || []), ...(fallback.red || [])])
  };
}

function titleizeKeyword(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferSuggestedIntents(message, color) {
  const lower = String(message || '').toLowerCase();
  const intents = [];
  if (includesAny(lower, SOCIALIZE_TERMS)) intents.push('socialize');
  if (includesAny(lower, COLLABORATE_TERMS)) intents.push('collaborate');
  if (includesAny(lower, TRADE_TERMS)) intents.push('trade');
  if (!intents.length) {
    if (color === 'green') intents.push('collaborate');
    if (color === 'yellow') intents.push('socialize');
  }
  return [...new Set(intents)].slice(0, 3);
}

function primaryKeywordForColor(keywords, color, message) {
  const chosen = keywords[color]?.[0]
    || keywords.green?.[0]
    || keywords.yellow?.[0]
    || keywords.red?.[0];
  if (chosen) return chosen;
  const fallback = String(message || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .find(word => word.length > 3);
  return fallback || 'conversation';
}

function detectRgyCapsule(message, keywordHints = {}) {
  const lower = String(message || '').toLowerCase();
  const selfHarm = includesAny(lower, SELF_HARM_TERMS);
  const explicit = includesAny(lower, RED_TERMS);
  const goal = includesAny(lower, GOAL_TERMS);
  const casual = includesAny(lower, CASUAL_TERMS);
  const selected = selfHarm ? 'yellow' : (explicit ? 'red' : (goal ? 'green' : (casual ? 'yellow' : 'yellow')));
  const meta = RGY_META[selected];
  const keywords = mergeKeywords(keywordHints, classifyMessageKeywords(message));
  const primaryKeyword = primaryKeywordForColor(keywords, selected, message);
  const suggestedIntents = inferSuggestedIntents(message, selected);
  const intentStatus = suggestedIntents.length > 1 ? 'ambiguous' : (suggestedIntents.length === 1 ? 'suggested' : 'pending');

  return {
    color: selected,
    signal: meta.color,
    label: meta.label,
    keyword: primaryKeyword,
    keyword_label: titleizeKeyword(primaryKeyword),
    intent: null,
    intent_status: selfHarm ? 'pending' : intentStatus,
    suggested_intents: selfHarm ? [] : suggestedIntents,
    confirmed_intents: [],
    matching_enabled: false,
    voice: selfHarm ? 'supportive' : meta.voice,
    age_gate_required: explicit && !selfHarm,
    self_harm_support: selfHarm,
    color_is_ui_only: true,
    keywords
  };
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
    JSON.stringify({ model: OPENAI_MODEL, max_completion_tokens: 512, messages })
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
    try {
      return mergeKeywords(JSON.parse(match[1]));
    } catch {}
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

function buildLocalFallback(message, primaryColor = 'green') {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'with', 'from', 'this', 'that', 'have', 'your', 'about', 'into'].includes(word));

  const unique = [...new Set(words)].slice(0, 9);
  const topic = unique[0] || 'this';
  const color = ['green', 'yellow', 'red'].includes(primaryColor) ? primaryColor : 'green';
  const keywords = classifyMessageKeywords(message);
  const assigned = new Set([...keywords.green, ...keywords.yellow, ...keywords.red]);
  keywords[color] = uniqueLimited([...keywords[color], ...unique.filter(word => !assigned.has(word)).slice(0, 6)]);
  const otherColors = ['green', 'yellow', 'red'].filter(item => item !== color);
  unique.filter(word => !assigned.has(word)).slice(6, 9).forEach((word, index) => {
    keywords[otherColors[index % otherColors.length]].push(word);
  });
  Object.keys(keywords).forEach(key => {
    keywords[key] = uniqueLimited(keywords[key]);
  });

  return {
    response: `I am here. I caught the signal around ${topic}; say a little more and I will help shape it into a clearer next move.`,
    keywords
  };
}

function buildSafetyResponse(message) {
  const fallback = buildLocalFallback(message, 'yellow');
  return {
    response: "I can't help with that request, but I can help reframe it into something safe, legal, and useful.",
    keywords: {
      green: fallback.keywords.green,
      yellow: ['reframe', 'boundary'],
      red: ['restricted']
    }
  };
}

function buildSelfHarmSupport(message) {
  const fallback = buildLocalFallback(message, 'yellow');
  return {
    response: "I am really glad you said something. I can't help with instructions for self-harm, but if you might act on this, call or text 988 in the U.S. or Canada now; if you are elsewhere, contact local emergency services or someone you trust and stay with them while the feeling is intense.",
    keywords: {
      green: fallback.keywords.green,
      yellow: ['support', 'safety', 'grounding'],
      red: []
    }
  };
}

function getProviderSequence(modelOverride) {
  const direct = normalizeProviderName(modelOverride);
  const registry = {
    openai: { name: 'openai', configured: Boolean(OPENAI_KEY), envName: OPENAI_ENV.name, fn: callOpenAI },
    anthropic: { name: 'anthropic', configured: Boolean(ANTHROPIC_KEY), envName: ANTHROPIC_ENV.name, fn: callClaude },
    openrouter: { name: 'openrouter', configured: Boolean(OPENROUTER_KEY), envName: OPENROUTER_ENV.name, fn: callOpenRouter }
  };
  if (direct === 'local') return [];
  const order = registry[direct] ? [direct] : PROVIDER_ORDER;
  return order.map(provider => registry[provider]).filter(Boolean);
}

function voiceSettingsForRgy(rgy = {}) {
  if (rgy.color === 'green') {
    return { stability: 0.7, similarity_boost: 0.6, style: 0.08, speed: 0.94, use_speaker_boost: false };
  }
  if (rgy.color === 'red') {
    return { stability: 0.82, similarity_boost: 0.56, style: 0.02, speed: 0.9, use_speaker_boost: false };
  }
  return { stability: 0.76, similarity_boost: 0.58, style: 0.05, speed: 0.92, use_speaker_boost: false };
}

async function generateElevenLabsAudio(text, rgy = {}) {
  if (!ELEVENLABS_KEY) return { audioUrl: null, error: 'No ElevenLabs key' };
  return new Promise((resolve) => {
    const body = JSON.stringify({
      text: text.slice(0, 500),
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: voiceSettingsForRgy(rgy)
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

  const { message, history, model } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const attempts = [];
  const directModel = normalizeProviderName(model);

  try {
    let rgy = detectRgyCapsule(message);

    if (rgy.self_harm_support) {
      const support = buildSelfHarmSupport(message);
      const audio = await generateElevenLabsAudio(support.response, rgy);
      return res.status(200).json({
        response: support.response,
        keywords: support.keywords,
        audio_url: audio.audioUrl,
        model_used: 'local-safety',
        rgy: detectRgyCapsule(message, support.keywords)
      });
    }

    // Web search if needed
    const contexts = [];
    if (needsWebSearch(message)) {
      const webContext = await searchWeb(message);
      if (webContext) contexts.push(webContext);
    }
    const context = contexts.join('\n\n');

    // Orchestrate providers. Operational failures fall through; safety refusals do not.
    let rawResponse = '', modelUsed = 'fallback';
    let safetyStop = false;
    for (const { name, configured, envName, fn } of getProviderSequence(directModel)) {
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
        console.warn(`${fn.name} failed:`, publicError(e));
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
      const fallback = safetyStop ? buildSafetyResponse(message) : buildLocalFallback(message, rgy.color);
      cleanText = fallback.response;
      keywords = fallback.keywords;
      modelUsed = 'local-fallback';
    }

    rgy = detectRgyCapsule(message, keywords);

    // ElevenLabs TTS
    const audio = await generateElevenLabsAudio(cleanText, rgy);

    const payload = {
      response: cleanText,
      keywords,
      audio_url: audio.audioUrl,
      model_used: modelUsed,
      rgy: {
        ...rgy,
        routing_mode: directModel && ['openai', 'anthropic', 'openrouter', 'local'].includes(directModel) ? 'direct' : 'intelligent',
        direct_model: directModel || null
      }
    };
    if (req.query?.diagnostics === '1' || req.body?.diagnostics === true) {
      payload.diagnostics = {
        env: {
          anthropic: { configured: Boolean(ANTHROPIC_KEY), name: ANTHROPIC_ENV.name, model: ANTHROPIC_MODEL },
          openai: { configured: Boolean(OPENAI_KEY), name: OPENAI_ENV.name, model: OPENAI_MODEL },
          openrouter: { configured: Boolean(OPENROUTER_KEY), name: OPENROUTER_ENV.name, model: OPENROUTER_MODEL },
          elevenlabs: { configured: Boolean(ELEVENLABS_KEY), name: ELEVENLABS_ENV.name, voice: ELEVENLABS_VOICE_ID, voice_name: ELEVENLABS_VOICE_NAME, model: ELEVENLABS_MODEL_ID }
        },
        runtime: runtimeManifestSnapshot(),
        provider_order: PROVIDER_ORDER,
        direct_model: directModel || null,
        attempts,
        tts: {
          configured: Boolean(ELEVENLABS_KEY),
          env: ELEVENLABS_ENV.name,
          ok: Boolean(audio.audioUrl),
          voice: ELEVENLABS_VOICE_NAME,
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

const https = require('https');

// AI model orchestration - Claude → GPT-4o → OpenRouter
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel

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
    JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 512, system: SYSTEM_PROMPT, messages })
  );
  return [JSON.parse(raw).content[0].text, 'claude-3-5-sonnet'];
}

async function callOpenAI(message, history, context) {
  if (!OPENAI_KEY) throw new Error('No OpenAI key');
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(history || []).slice(-8)];
  const userContent = context ? `${context}\n\n${message}` : message;
  messages.push({ role: 'user', content: userContent });

  const raw = await httpsPost(
    'https://api.openai.com/v1/chat/completions',
    { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    JSON.stringify({ model: 'gpt-4o', max_tokens: 512, messages })
  );
  return [JSON.parse(raw).choices[0].message.content, 'gpt-4o'];
}

async function callOpenRouter(message, history, context) {
  if (!OPENROUTER_KEY) throw new Error('No OpenRouter key');
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(history || []).slice(-8)];
  const userContent = context ? `${context}\n\n${message}` : message;
  messages.push({ role: 'user', content: userContent });

  const raw = await httpsPost(
    'https://openrouter.ai/api/v1/chat/completions',
    { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
    JSON.stringify({ model: 'anthropic/claude-3.5-sonnet', max_tokens: 512, messages })
  );
  return [JSON.parse(raw).choices[0].message.content, 'openrouter/claude-3.5'];
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

async function generateElevenLabsAudio(text) {
  if (!ELEVENLABS_KEY) return null;
  return new Promise((resolve) => {
    const body = JSON.stringify({
      text: text.slice(0, 500),
      model_id: 'eleven_monolingual_v1',
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
          resolve(`data:audio/mpeg;base64,${b64}`);
        } else resolve(null);
      });
    });
    req.on('error', () => resolve(null));
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

  try {
    // Web search if needed
    let context = '';
    if (needsWebSearch(message)) {
      context = await searchWeb(message);
    }

    // Orchestrate: Claude → GPT-4o → OpenRouter
    let rawResponse = '', modelUsed = 'fallback';
    for (const fn of [callClaude, callOpenAI, callOpenRouter]) {
      try {
        [rawResponse, modelUsed] = await fn(message, history, context);
        break;
      } catch (e) {
        console.warn(`${fn.name} failed:`, e.message);
      }
    }

    if (!rawResponse) {
      modelUsed = 'local-fallback';
    }

    let keywords = extractKeywords(rawResponse);
    let cleanText = cleanResponse(rawResponse);

    if (!cleanText) {
      const fallback = buildLocalFallback(message);
      cleanText = fallback.response;
      keywords = fallback.keywords;
      modelUsed = 'local-fallback';
    }

    // ElevenLabs TTS
    const audioUrl = await generateElevenLabsAudio(cleanText);

    return res.status(200).json({ response: cleanText, keywords, audio_url: audioUrl, model_used: modelUsed });

  } catch (err) {
    console.error('Converse error:', err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
};

import https from 'https';

export type RgyColor = 'green' | 'yellow' | 'red';
export type RgyIntent = 'socialize' | 'collaborate' | 'trade';
export type RgyIntentStatus = 'pending' | 'suggested' | 'ambiguous' | 'confirmed';
export type RgySource = 'taxonomy' | 'llm' | 'user_correction';

export type RgyClassification = {
  color: RgyColor;
  keyword: string;
  intent_status: Exclude<RgyIntentStatus, 'confirmed'>;
  suggested_intents: RgyIntent[];
  confidence: number;
  reasoning: string;
  source: Exclude<RgySource, 'user_correction'>;
  age_gate_required: boolean;
};

export type RgySafetyStop = {
  status: 'crisis' | 'blocked';
  capsule: null;
  stored: false;
  message: string;
  resources?: string[];
  reason: string;
};

type RgySafetyContinue = {
  status: 'continue';
  age_gate_required: boolean;
};

type TaxonomyMatch = {
  color: RgyColor;
  keyword: string;
  suggested_intents: RgyIntent[];
  intent_status: 'pending' | 'suggested';
  confidence: number;
  reasoning: string;
};

const RGY_COLORS = ['green', 'yellow', 'red'] as const;
const RGY_INTENTS = ['socialize', 'collaborate', 'trade'] as const;

// Section 1: safety. These checks always run before taxonomy or LLM work.
// Crisis and hard-block paths intentionally create no capsule and no DB row.
const CRISIS_PATTERNS = [
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bend my life\b/i,
  /\bself[-\s]?harm\b/i,
  /\bi want to die\b/i
];

const HARD_BLOCK_PATTERNS = [
  /\billegal drugs?\b/i,
  /\bdrug trafficking\b/i,
  /\bmake (?:a )?bomb\b/i,
  /\bweapon trafficking\b/i,
  /\bcredit card fraud\b/i
];

const AGE_GATE_PATTERNS = [
  /\badult\b/i,
  /\bexplicit\b/i,
  /\bnsfw\b/i,
  /\bhookup\b/i,
  /\bage[-\s]?gated\b/i,
  /\brestricted\b/i,
  /\badult apps?\b/i,
  /\badult content\b/i,
  /\bgrindr\b/i,
  /\btinder\b/i
];

// Section 2: deterministic taxonomy. These are mode signals, not labels for
// people. The same surface word can still be re-read by the LLM when context
// is not clear enough for taxonomy.
const GREEN_TAXONOMY = [
  'growth',
  'wellness',
  'career',
  'job study',
  'resume',
  'interview',
  'learning',
  'gym',
  'meditation',
  'planning',
  'building',
  'coding',
  'study',
  'certification',
  'discipline',
  'self-improvement',
  'startup',
  'yoga',
  'healthy habits',
  'productivity'
];

const YELLOW_TAXONOMY = [
  'movie night',
  'friends',
  'hangout',
  'hang out',
  'social',
  'chat',
  'coffee',
  'party',
  'games',
  'music',
  'entertainment',
  'weekend',
  'casual',
  'comfort',
  'netflix',
  'popcorn',
  'dating',
  'going out',
  'drinks'
];

const RED_TAXONOMY = [
  'adult',
  'explicit',
  'hookup',
  'nsfw',
  'age-gated',
  'age gated',
  'restricted',
  'adult apps',
  'adult content'
];

const TAXONOMY_BY_COLOR: Array<[RgyColor, string[]]> = [
  ['red', RED_TAXONOMY],
  ['green', GREEN_TAXONOMY],
  ['yellow', YELLOW_TAXONOMY]
];

function cleanEnv(...values: Array<string | undefined>) {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
}

// Narrow HTTP helper for the one classifier fallback call. Keeping it here
// avoids pulling more orchestration code into this safety-sensitive path.
function httpsPost(url: string, headers: Record<string, string>, body: string) {
  return new Promise<string>((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
      },
      res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 240)}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function includesPattern(input: string, patterns: RegExp[]) {
  return patterns.some(pattern => pattern.test(input));
}

function phraseRegex(phrase: string) {
  return new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+')}\\b`, 'i');
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeKeyword(value: string) {
  const words = value
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return titleCase(words.join(' ')).slice(0, 80);
}

function normalizeIntentArray(value: unknown): RgyIntent[] {
  const raw = Array.isArray(value) ? value : [];
  return [...new Set(raw
    .map(item => String(item || '').trim().toLowerCase())
    .filter((item): item is RgyIntent => RGY_INTENTS.includes(item as RgyIntent)))]
    .slice(0, 3);
}

function keywordForMatch(input: string, term: string, color: RgyColor) {
  const lower = input.toLowerCase();
  if (color === 'green' && lower.includes('startup') && /\b(build|building|create|launch)\b/.test(lower)) {
    return 'Startup Build';
  }
  if (color === 'yellow' && /\bhang\s*out\b|\bhangout\b/.test(lower)) {
    return 'Hangout';
  }
  if (color === 'red' && /\badult apps?\b/.test(lower)) {
    return 'Adult Apps';
  }
  return normalizeKeyword(term);
}

function suggestedForTaxonomy(input: string, color: RgyColor, keyword: string): RgyIntent[] {
  const lower = input.toLowerCase();
  if (color === 'red') return [];
  if (/\b(sell|buy|deal|trade|client|customer|revenue|shop|store)\b/.test(lower)) return ['trade'];
  if (/\b(friend|friends|meet|hangout|hang out|movie|party|coffee|dating|social)\b/.test(lower)) return ['socialize'];
  if (/\b(startup|build|building|coding|career|job|resume|interview|collaborate|team|partner)\b/.test(lower)) return ['collaborate'];
  if (color === 'yellow' && ['Movie Night', 'Hangout'].includes(keyword)) return ['socialize'];
  return [];
}

function taxonomyMatch(input: string, forcedRed: boolean): TaxonomyMatch | null {
  for (const [color, terms] of TAXONOMY_BY_COLOR) {
    for (const term of terms) {
      if (!phraseRegex(term).test(input)) continue;
      const finalColor = forcedRed ? 'red' : color;
      const keyword = keywordForMatch(input, term, finalColor);
      const suggested_intents = suggestedForTaxonomy(input, finalColor, keyword);
      return {
        color: finalColor,
        keyword,
        suggested_intents,
        intent_status: suggested_intents.length ? 'suggested' : 'pending',
        confidence: 0.9,
        reasoning: `${titleCase(finalColor)} taxonomy matched "${term}".`
      };
    }
  }

  if (forcedRed) {
    return {
      color: 'red',
      keyword: 'Age Gated Activity',
      suggested_intents: [],
      intent_status: 'pending',
      confidence: 0.92,
      reasoning: 'Age-gate keyword forced red mode.'
    };
  }

  return null;
}

export function runSafetyLayer(input: string): RgySafetyStop | RgySafetyContinue {
  if (includesPattern(input, CRISIS_PATTERNS)) {
    return {
      status: 'crisis',
      capsule: null,
      stored: false,
      reason: 'crisis_keyword',
      message:
        'I am really sorry you are feeling this. If you might hurt yourself or feel in immediate danger, call 988 in the US/Canada or your local emergency number now. If you can, move near another person and tell them directly: "I am not safe alone right now."',
      resources: ['US/Canada: call or text 988', 'Emergency danger: call local emergency services']
    };
  }

  if (includesPattern(input, HARD_BLOCK_PATTERNS)) {
    return {
      status: 'blocked',
      capsule: null,
      stored: false,
      reason: 'hard_block_keyword',
      message: 'I cannot help with illegal facilitation. No RGY capsule was created.'
    };
  }

  return {
    status: 'continue',
    age_gate_required: includesPattern(input, AGE_GATE_PATTERNS)
  };
}

export const runRgySafetyLayer = runSafetyLayer;

// Section 3: LLM fallback. Keep this prompt text aligned with the product
// spec; taxonomy should handle the fast/common cases before this is called.
function buildLlmPrompt(input: string) {
  return `You are reading the mode of human activity 
behind this input.

Three modes exist:
Green (Sattva): growth, discipline, clarity, 
learning, wellness, building, conscious effort.
Yellow (Rajas): social, pleasure, passion, 
stimulation, entertainment, active desire, 
outward energy.
Red (Tamas): heavy, instinctual, age-gated, 
restricted, excess, adult.

The same word can be different colors depending 
on context and energy. Read the mode, not just 
the word.

Return ONLY this JSON, nothing else:
{
  'color': 'green' | 'yellow' | 'red',
  'keyword': '2-4 word specific activity',
  'intent_status': 'pending' | 'suggested' | 
                   'ambiguous',
  'suggested_intents': [] | ['socialize'] | 
    ['collaborate'] | ['trade'] | 
    ['socialize','collaborate'] |
    ['socialize','trade'] |
    ['collaborate','trade'] |
    ['socialize','collaborate','trade'],
  'confidence': 0.0 to 1.0,
  'reasoning': 'one sentence max'
}

Rules:
- keyword is the specific activity, not the zone
- confidence below 0.6 = intent_status ambiguous
- suggested_intents are suggestions only
- never add fields
- never return text outside the JSON

User input: [INPUT]`.replace('[INPUT]', input);
}

function parseClassifierJson(text: string) {
  const trimmed = text.trim();
  const parsed = JSON.parse(trimmed);
  const color = String(parsed.color || '').toLowerCase();
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)));
  const suggested_intents = normalizeIntentArray(parsed.suggested_intents);
  let intent_status = String(parsed.intent_status || '').toLowerCase();

  if (!RGY_COLORS.includes(color as RgyColor)) throw new Error('Invalid RGY color');
  if (!['pending', 'suggested', 'ambiguous'].includes(intent_status)) throw new Error('Invalid RGY intent_status');
  if (confidence < 0.6) intent_status = 'ambiguous';

  return {
    color: color as RgyColor,
    keyword: normalizeKeyword(String(parsed.keyword || 'Ambiguous Activity')) || 'Ambiguous Activity',
    intent_status: intent_status as Exclude<RgyIntentStatus, 'confirmed'>,
    suggested_intents,
    confidence,
    reasoning: String(parsed.reasoning || 'LLM classified the activity mode.').trim().slice(0, 180)
  };
}

async function classifyWithLlm(input: string) {
  const key = cleanEnv(process.env.OPENAI_API_KEY, process.env.OPENAI_KEY, process.env.AI_API_KEY);
  if (!key) throw new Error('OpenAI key unavailable');
  const model = cleanEnv(process.env.OPENAI_MODEL, process.env.AI_MODEL) || 'gpt-5.4';
  const prompt = buildLlmPrompt(input);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await httpsPost(
        'https://api.openai.com/v1/chat/completions',
        {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        JSON.stringify({
          model,
          max_completion_tokens: 350,
          messages: [{ role: 'user', content: prompt }]
        })
      );
      const content = JSON.parse(raw).choices?.[0]?.message?.content || '';
      return parseClassifierJson(content);
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  throw new Error('LLM classification failed');
}

export async function classifyRgyActivity(input: string): Promise<RgyClassification | RgySafetyStop> {
  const cleanInput = String(input || '').trim();
  const safety = runSafetyLayer(cleanInput);
  if (safety.status !== 'continue') return safety;

  const taxonomy = taxonomyMatch(cleanInput, safety.age_gate_required);
  if (taxonomy) {
    return {
      ...taxonomy,
      source: 'taxonomy',
      age_gate_required: safety.age_gate_required || taxonomy.color === 'red'
    };
  }

  try {
    const llm = await classifyWithLlm(cleanInput);
    const color = safety.age_gate_required ? 'red' : llm.color;
    return {
      ...llm,
      color,
      suggested_intents: color === 'red' ? [] : llm.suggested_intents,
      intent_status: color === 'red' ? 'pending' : llm.intent_status,
      source: 'llm',
      age_gate_required: safety.age_gate_required || color === 'red'
    };
  } catch (error) {
    return {
      color: safety.age_gate_required ? 'red' : 'yellow',
      keyword: safety.age_gate_required ? 'Age Gated Activity' : 'Ambiguous Activity',
      intent_status: 'ambiguous',
      suggested_intents: [],
      confidence: 0,
      reasoning: `Classifier fallback: ${error instanceof Error ? error.message : 'parse failure'}`.slice(0, 180),
      source: 'llm',
      age_gate_required: safety.age_gate_required
    };
  }
}

export function capsuleOnly(result: RgyClassification) {
  return {
    color: result.color,
    keyword: result.keyword,
    intent_status: result.intent_status
  };
}

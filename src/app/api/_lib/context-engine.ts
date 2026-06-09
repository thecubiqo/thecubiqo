import { cleanEnv } from './supabase-admin';
import { scrapeUrl } from './content-scraper';
import { getContextParams, getModel } from '@/next/lib/config/llm';
import { cfg } from '@/next/lib/config/runtime';
import { NEGATIVE_WORDS, POSITIVE_WORDS, SKILL_KEYWORDS, STOP_WORDS } from '@/next/lib/rgy/term-registry';

export type ContextResult = {
  summary: string;
  topics: string[];
  entities: { name: string; type: 'person' | 'org' | 'role' | 'skill' | 'location' | 'product' | 'other' }[];
  claims: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keywords: string[];
  confidence: number;
  source: 'llm' | 'local';
};

// ── Local fallback ─────────────────────────────────────────────────────────
function localExtract(text: string): ContextResult {
  const sentences = text.match(/[^.!?]+[.!?]/g) || [];

  // Summary: first 2 sentences
  const summary = sentences.slice(0, 2).join(' ').trim().slice(0, 400) || text.slice(0, 200);

  // Topics: capitalized noun-like tokens, dedupe, top 6
  const capWords = (text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [])
    .filter(w => !['The','This','That','With','From','Your','Their','Have','Will','When','They','What','Where'].includes(w));
  const topicFreq: Record<string, number> = {};
  capWords.forEach(w => { topicFreq[w] = (topicFreq[w] || 0) + 1; });
  const topics = Object.entries(topicFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, cfg.contextMaxTopics)
    .map(([w]) => w);

  // Entities
  const entities: ContextResult['entities'] = [];
  const emailMatches = text.match(/\b[\w.+-]+@[\w-]+\.\w{2,}\b/g) || [];
  emailMatches.forEach(e => entities.push({ name: e, type: 'person' }));
  const urlMatches = text.match(/https?:\/\/[^\s]+/g) || [];
  urlMatches.slice(0, cfg.contextMaxUrls).forEach(u => entities.push({ name: u, type: 'org' }));
  const lowerText = text.toLowerCase();
  SKILL_KEYWORDS.forEach(skill => {
    if (lowerText.includes(skill)) entities.push({ name: skill, type: 'skill' });
  });

  // Claims: sentences > 40 chars, first 5
  const claims = sentences
    .map(s => s.trim())
    .filter(s => s.length > 40)
    .slice(0, cfg.contextMaxClaims);

  // Sentiment
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  const sentiment: ContextResult['sentiment'] =
    pos > neg + 1 ? 'positive' : neg > pos + 1 ? 'negative' : pos > 0 && neg > 0 ? 'mixed' : 'neutral';

  // Keywords: word frequency, filter stop words, top 10
  const wordFreq: Record<string, number> = {};
  (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
    .filter(w => !STOP_WORDS.has(w))
    .forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, cfg.contextMaxKeywords)
    .map(([w]) => w);

  return { summary, topics, entities, claims, sentiment, keywords, confidence: 0.4, source: 'local' };
}

// ── LLM extraction ─────────────────────────────────────────────────────────
async function llmExtract(text: string, goal?: string, apiKey?: string): Promise<ContextResult | null> {
  if (!apiKey) return null;

  const systemPrompt = 'You are a semantic analysis engine. Extract structured context from the provided text. Return ONLY valid JSON matching the exact schema provided. No markdown fences, no explanation.';

  const schema = `{"summary":"string","topics":["string"],"entities":[{"name":"string","type":"person|org|role|skill|location|product|other"}],"claims":["string"],"sentiment":"positive|neutral|negative|mixed","keywords":["string"],"confidence":0.88,"source":"llm"}`;

  const params = getContextParams();
  const userMsg = [
    goal ? `Goal: ${goal}` : '',
    `Text:\n${text.slice(0, 4000)}`,
    `Return JSON matching: ${schema}`,
    `Rules: topics max ${cfg.contextMaxTopics}, entities max 10, claims max 8 (key factual assertions), keywords max ${cfg.contextMaxKeywords}.`,
  ].filter(Boolean).join('\n\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getModel('utility'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    const raw = data.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as ContextResult;
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function extractContext(text: string, goal?: string): Promise<ContextResult> {
  const apiKey = cleanEnv(process.env.OPENAI_API_KEY);
  const llmResult = await llmExtract(text, goal, apiKey || undefined);
  return llmResult ?? localExtract(text);
}

export async function extractContextFromUrl(url: string): Promise<ContextResult & { scrapeError?: string }> {
  const scrape = await scrapeUrl(url);
  if (scrape.error || !scrape.bodyText) {
    const fallback = localExtract(scrape.bodyText || url);
    return { ...fallback, scrapeError: scrape.error || 'Empty body' };
  }
  const context = await extractContext(scrape.bodyText);
  return context;
}

/**
 * Reconnaissance Engine
 * Drives the background agent's structured research pattern.
 * Called from /api/agent/background before any web search.
 */

export type DomainKey =
  | 'startup'
  | 'marketing'
  | 'sales'
  | 'investment'
  | 'ecommerce'
  | 'career'
  | 'health'
  | 'social'
  | 'general';

export interface CapsuleShape {
  color?: string;
  keyword?: string;
  normalized_keyword?: string;
  suggested_intents?: string[];
}

export interface BriefingStructure {
  headline: string;
  context_summary: string;
  blockers: Array<{ title: string; why: string; severity: 'high' | 'med' | 'low' }>;
  recommended_actions: Array<{ step: string; why: string; effort: '10min' | '1hr' | '1day' | '1week' }>;
  open_questions: Array<{ question: string; why_it_matters: string }>;
  research_results?: Array<{ query: string; summary: string; url?: string; relevance: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain detection
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_KEYWORD_MAP: Record<DomainKey, string[]> = {
  startup: [
    'launch', 'startup', 'mvp', 'product', 'founder', 'saas', 'app', 'build', 'ship',
    'traction', 'pmf', 'pivot', 'idea', 'validate', 'b2b', 'b2c', 'vc', 'accelerator', 'yc'
  ],
  marketing: [
    'marketing', 'brand', 'seo', 'content', 'campaign', 'ad', 'ads', 'audience',
    'funnel', 'growth', 'email', 'newsletter', 'hook', 'copy', 'landing page', 'cac', 'ltv'
  ],
  sales: [
    'sales', 'pipeline', 'outreach', 'crm', 'deal', 'close', 'prospect', 'lead',
    'demo', 'objection', 'pricing', 'proposal', 'quota', 'revenue', 'b2b sales'
  ],
  investment: [
    'investor', 'investment', 'raise', 'funding', 'pitch', 'deck', 'seed', 'series',
    'angel', 'vc', 'term sheet', 'equity', 'safe', 'valuation', 'cap table', 'due diligence',
    'arr', 'mrr', 'traction', 'crunchbase', 'angellist'
  ],
  ecommerce: [
    'shopify', 'store', 'product', 'pod', 'print', 'printify', 'printful', 'ecommerce',
    'e-commerce', 'shop', 'sell', 'listing', 'dropship', 'fulfillment', 'inventory',
    'order', 'collection', 'variant', 'shipping', 'gelato'
  ],
  career: [
    'job', 'resume', 'cv', 'career', 'apply', 'application', 'hire', 'hiring',
    'interview', 'linkedin', 'salary', 'offer', 'recruiter', 'ats', 'cover letter',
    'role', 'position', 'employment'
  ],
  health: [
    'health', 'fitness', 'workout', 'diet', 'nutrition', 'sleep', 'stress', 'anxiety',
    'meditation', 'wellness', 'therapy', 'habit', 'routine', 'mental health', 'exercise',
    'weight', 'mindfulness', 'burnout'
  ],
  social: [
    'instagram', 'tiktok', 'twitter', 'x', 'linkedin post', 'content creator', 'influencer',
    'post', 'reel', 'video', 'youtube', 'threads', 'facebook', 'social media', 'followers',
    'engagement', 'viral', 'algorithm', 'creator'
  ],
  general: []
};

export function detectDomain(capsule: CapsuleShape): DomainKey {
  const text = [
    capsule.keyword || '',
    capsule.normalized_keyword || '',
    (capsule.suggested_intents || []).join(' ')
  ].join(' ').toLowerCase();

  const scores: Partial<Record<DomainKey, number>> = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORD_MAP) as [DomainKey, string[]][]) {
    if (domain === 'general') continue;
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > 0) scores[domain] = score;
  }

  if (Object.keys(scores).length === 0) return 'general';

  // Return domain with highest score
  return (Object.entries(scores) as [DomainKey, number][])
    .sort(([, a], [, b]) => b - a)[0][0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Query builder
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_QUERY_TEMPLATES: Record<DomainKey, (keyword: string) => string[]> = {
  startup: (kw) => [
    `${kw} startup launch checklist 2025`,
    `${kw} product market fit validation steps`,
    `${kw} founder mistakes first 90 days`,
    `${kw} MVP scope what to cut`,
    `${kw} first 10 customers how to get`
  ],
  marketing: (kw) => [
    `${kw} marketing strategy 2025`,
    `${kw} content hook formula examples`,
    `${kw} growth loop acquisition channel`,
    `${kw} CAC LTV benchmarks industry`,
    `${kw} distribution strategy before product`
  ],
  sales: (kw) => [
    `${kw} sales outreach cadence template`,
    `${kw} objection handling scripts`,
    `${kw} pipeline stages best practice`,
    `${kw} closing technique high ticket`,
    `${kw} demo structure conversion rate`
  ],
  investment: (kw) => [
    `${kw} seed round pitch deck structure 2025`,
    `${kw} what investors look for traction metrics`,
    `${kw} SAFE vs equity early stage funding`,
    `${kw} investor update template founders`,
    `${kw} term sheet red flags to watch`
  ],
  ecommerce: (kw) => [
    `${kw} hero product strategy ecommerce`,
    `${kw} POD pricing margins profit calculator`,
    `${kw} Shopify product launch checklist`,
    `${kw} print on demand supplier comparison`,
    `${kw} ecommerce conversion rate optimisation`
  ],
  career: (kw) => [
    `${kw} job market trends 2025`,
    `${kw} resume ATS optimisation tips`,
    `${kw} interview preparation common questions`,
    `${kw} salary negotiation strategy`,
    `${kw} LinkedIn profile optimisation recruiter`
  ],
  health: (kw) => [
    `${kw} habit formation science research`,
    `${kw} sustainable approach evidence based`,
    `${kw} common mistakes pitfalls beginners`,
    `${kw} accountability structure routine`,
    `${kw} mental health wellbeing connection`
  ],
  social: (kw) => [
    `${kw} algorithm 2025 what performs best`,
    `${kw} content format hook viral structure`,
    `${kw} posting frequency optimal engagement`,
    `${kw} creator monetisation strategy`,
    `${kw} repurposing content across platforms`
  ],
  general: (kw) => [
    `${kw} how to get started guide 2025`,
    `${kw} best practices expert advice`,
    `${kw} common mistakes to avoid`,
    `${kw} tools resources recommended`
  ]
};

export function buildReconQueries(
  domain: DomainKey,
  keyword: string,
  userContext: string = ''
): string[] {
  const cleanKeyword = keyword.trim() || 'goal';
  const templates = DOMAIN_QUERY_TEMPLATES[domain] || DOMAIN_QUERY_TEMPLATES.general;
  const queries = templates(cleanKeyword);

  // If user context has specific terms, add a contextual query
  if (userContext && userContext.length > 10) {
    const contextWords = userContext.split(/\s+/).slice(0, 5).join(' ');
    queries.push(`${cleanKeyword} ${contextWords} specific strategy`);
  }

  return queries.slice(0, 5); // max 5 queries
}

// ─────────────────────────────────────────────────────────────────────────────
// Briefing parser (F7-B: multi-level fallback)
// ─────────────────────────────────────────────────────────────────────────────

function isValidBriefing(obj: any): obj is BriefingStructure {
  return (
    obj &&
    typeof obj.headline === 'string' &&
    typeof obj.context_summary === 'string' &&
    Array.isArray(obj.blockers) &&
    Array.isArray(obj.recommended_actions) &&
    Array.isArray(obj.open_questions)
  );
}

export function parseBriefingFromAgentOutput(text: string): BriefingStructure | null {
  if (!text || typeof text !== 'string') return null;

  // Level 1: try ```briefing ... ``` fence
  const fenceMatch = text.match(/```briefing\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (isValidBriefing(parsed)) return parsed;
    } catch {}
  }

  // Level 2: try ```json ... ``` fence
  const jsonFenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonFenceMatch) {
    try {
      const parsed = JSON.parse(jsonFenceMatch[1].trim());
      if (isValidBriefing(parsed)) return parsed;
    } catch {}
  }

  // Level 3: try to find any { ... } block with headline key
  const jsonBlockMatch = text.match(/\{[\s\S]*?"headline"[\s\S]*?\}/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[0]);
      if (isValidBriefing(parsed)) return parsed;
    } catch {}
  }

  // Level 4: construct minimal briefing from agent text (last resort)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const fallback: BriefingStructure = {
      headline: lines[0].slice(0, 200),
      context_summary: lines.slice(1, 3).join(' ').slice(0, 500) || 'Agent completed research.',
      blockers: [],
      recommended_actions: [],
      open_questions: []
    };
    // Try to extract bullet points as actions
    const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*'));
    if (bullets.length > 0) {
      fallback.recommended_actions = bullets.slice(0, 4).map((b, i) => ({
        step: b.replace(/^[-•*]\s*/, '').slice(0, 150),
        why: 'Identified during reconnaissance.',
        effort: (['10min', '1hr', '1day', '1week'] as const)[Math.min(i, 3)]
      }));
    }
    return fallback;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured briefing prompt (injected into background agent system prompt)
// ─────────────────────────────────────────────────────────────────────────────

export const BRIEFING_OUTPUT_INSTRUCTION = `
After completing your research, you MUST output a structured briefing using this exact format.
Wrap the JSON in triple-backtick briefing fences — no other text after the JSON block:

\`\`\`briefing
{
  "headline": "One sentence: exactly where the user stands right now (specific, not generic)",
  "context_summary": "2-3 sentences: what you understood about their goal and situation",
  "blockers": [
    { "title": "Specific blocker name", "why": "Why this blocks progress", "severity": "high|med|low" }
  ],
  "recommended_actions": [
    { "step": "Specific action (verb-first)", "why": "Why this matters now", "effort": "10min|1hr|1day|1week" }
  ],
  "open_questions": [
    { "question": "Specific question you need answered", "why_it_matters": "How the answer changes the strategy" }
  ],
  "research_results": [
    { "query": "search query used", "summary": "Key finding in 1-2 sentences", "url": "source URL if available", "relevance": "Why this matters to user" }
  ]
}
\`\`\`

Rules:
- headline must be SPECIFIC to this user's situation — not generic advice
- blockers must be real blockers you identified, not placeholders
- recommended_actions must be ordered by effort (10min tasks first)
- open_questions must be questions whose answers would change your recommendations
- Do NOT add any text after the closing triple backticks
`;

// ─────────────────────────────────────────────────────────────────────────────
// Browserbase trigger rules
// ─────────────────────────────────────────────────────────────────────────────

export function shouldUseBrowserbase(domain: DomainKey, userContext: string): boolean {
  const deepDiveDomains: DomainKey[] = ['investment', 'marketing'];
  if (deepDiveDomains.includes(domain)) return true;

  // Ecommerce: only if store/account status unknown
  if (domain === 'ecommerce') {
    const ctx = userContext.toLowerCase();
    return !ctx.includes('connected') && !ctx.includes('store url');
  }

  // Social: only if account connection unknown
  if (domain === 'social') {
    return !userContext.toLowerCase().includes('connected');
  }

  return false;
}

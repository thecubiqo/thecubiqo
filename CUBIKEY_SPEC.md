# CubiKey + Smart Model Orchestration — Build Spec
## For: Henry → Dev Agent

---

## VISION

CubiQo becomes an AI router that auto-detects intent and picks the cheapest/best model.
Then package this as **CubiKey** — a single API key that developers use like OpenAI's key,
but it routes to the cheapest model that can handle the task. Revenue product.

---

## PART 1: SMART MODEL ORCHESTRATION

### 1.1 Model Tier System

```
TIER 1: FREE / Near-Free (use first)
├── Groq (Llama 3.3 70B)     — FREE tier, insanely fast
├── Groq (Mixtral 8x7B)      — FREE tier, fast
├── Groq (Llama 3.1 8B)      — FREE tier, fastest
├── Google (Gemini Flash)     — FREE tier generous
└── Together.ai free models   — FREE tier available

TIER 2: Cheap ($0.10-0.50/M tokens)
├── Mistral (Mistral Small)   — ~$0.10/M input
├── OpenRouter (free models)  — $0 for some
├── Deepseek V3              — ~$0.14/M input
└── Claude Haiku             — ~$0.25/M input

TIER 3: Standard ($1-5/M tokens)
├── Claude Sonnet 4.5        — $3/M input
├── GPT-4o                   — $2.50/M input
└── Gemini Pro               — $1.25/M input

TIER 4: Premium ($5+/M tokens)  
├── Claude Opus 4.5          — $15/M input
├── GPT-5.2                  — $10/M input (est)
└── o1/o3 reasoning          — $15/M input
```

### 1.2 Intent Detection → Model Selection

**File:** `src/lib/ai/intent-router.ts` (NEW)

```typescript
interface IntentClassification {
  category: 'casual' | 'factual' | 'creative' | 'coding' | 'reasoning' | 'analysis' | 'vision';
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  requiresTools: boolean;
  estimatedTokens: number;
  recommendedTier: 1 | 2 | 3 | 4;
  recommendedModel: string;
}

function classifyIntent(message: string, conversationHistory: Message[]): IntentClassification {
  // RULE-BASED CLASSIFICATION (no LLM call needed = free)
  
  const msg = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  
  // Simple greetings / casual → Tier 1 (free)
  if (wordCount < 10 && /^(hi|hello|hey|thanks|ok|yes|no|sure|cool)/.test(msg)) {
    return { category: 'casual', complexity: 'simple', recommendedTier: 1, ... };
  }
  
  // Factual questions → Tier 1-2
  if (/^(what|who|when|where|how many|define|explain simply)/.test(msg) && wordCount < 30) {
    return { category: 'factual', complexity: 'simple', recommendedTier: 1, ... };
  }
  
  // Coding → Tier 2-3 (needs good model)
  if (/code|function|bug|error|implement|api|database|deploy|typescript|python|react/.test(msg)) {
    return { 
      category: 'coding', 
      complexity: wordCount > 50 ? 'complex' : 'medium', 
      recommendedTier: wordCount > 100 ? 3 : 2, 
      ... 
    };
  }
  
  // Creative writing → Tier 2
  if (/write|story|poem|essay|blog|marketing|copy|draft|creative/.test(msg)) {
    return { category: 'creative', complexity: 'medium', recommendedTier: 2, ... };
  }
  
  // Deep reasoning / analysis → Tier 3-4
  if (/analyze|compare|evaluate|strategy|architecture|patent|legal|research deeply/.test(msg)) {
    return { category: 'reasoning', complexity: 'complex', recommendedTier: 3, ... };
  }
  
  // Long complex prompts → Tier 3
  if (wordCount > 100) {
    return { category: 'analysis', complexity: 'complex', recommendedTier: 3, ... };
  }
  
  // Default → Tier 2 (cheap but capable)
  return { category: 'factual', complexity: 'medium', recommendedTier: 2, ... };
}
```

### 1.3 Model Cascade (fallback chain)

```typescript
// Try cheapest first, fall back to more expensive if it fails or quality is poor
async function cascadeCall(messages, intent): Promise<LLMResponse> {
  const models = getModelsForTier(intent.recommendedTier);
  
  for (const model of models) {
    try {
      const response = await callModel(model, messages);
      
      // Quality check: if response is too short or seems wrong, try next tier
      if (response.content.length < 20 && intent.complexity !== 'simple') {
        continue; // Try next model
      }
      
      return response;
    } catch (error) {
      // Rate limited or error → try next
      continue;
    }
  }
  
  // All failed → use premium as last resort
  return callModel(PREMIUM_FALLBACK, messages);
}
```

### 1.4 Actual Provider Implementations

**File:** `src/lib/ai/providers/groq.ts` (NEW)
```typescript
// Groq = FREE Llama/Mixtral with 6000 req/day
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Models available on Groq free tier:
// - llama-3.3-70b-versatile (best free model)
// - llama-3.1-8b-instant (fastest)
// - mixtral-8x7b-32768 (good for long context)
// - gemma2-9b-it (Google's free model)

export async function callGroq(messages, model = 'llama-3.3-70b-versatile') {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  // ... parse OpenAI-compatible response
}
```

**File:** `src/lib/ai/providers/openrouter.ts` (NEW)
```typescript
// OpenRouter = access to ALL models via one API, some free
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Free models on OpenRouter:
// - meta-llama/llama-3.3-70b-instruct:free
// - google/gemma-2-9b-it:free
// - mistralai/mistral-7b-instruct:free
// - qwen/qwen-2.5-72b-instruct:free

export async function callOpenRouter(messages, model) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cubiqo.ai',
      'X-Title': 'CubiQo',
    },
    body: JSON.stringify({ model, messages }),
  });
}
```

**File:** `src/lib/ai/providers/together.ts` (NEW)
```typescript
// Together.ai = cheap Llama/Mixtral hosting
const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';
```

---

## PART 2: COST OPTIMIZATION ENGINE

**File:** `src/lib/ai/cost-optimizer.ts` (NEW)

```typescript
interface UsageBudget {
  dailyBudgetCents: number;     // e.g. 50 = $0.50/day
  monthlyBudgetCents: number;   // e.g. 500 = $5.00/month
  currentDailySpend: number;
  currentMonthlySpend: number;
}

function selectModel(intent: IntentClassification, budget: UsageBudget): ModelConfig {
  // If budget is tight, force Tier 1 (free models)
  if (budget.currentDailySpend > budget.dailyBudgetCents * 0.8) {
    return getFreeModel(intent); // Always returns a Groq/OpenRouter free model
  }
  
  // Normal routing based on intent
  return getModelForIntent(intent);
}

// Cost tracking per request
function trackCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  // Store in Supabase usage_log
  return cost;
}
```

### Near-Free Strategy:
1. **80% of requests** → Groq free tier (Llama 3.3 70B handles most things well)
2. **15% of requests** → Tier 2 cheap models (complex coding, creative)
3. **5% of requests** → Tier 3-4 premium (deep reasoning, patents, analysis)
4. **Result**: Average cost ~$0.001/request instead of $0.05/request = **50x cheaper**

---

## PART 3: CUBIKEY — API PRODUCT

### What is CubiKey?
A single API key (`cubk_...`) that developers use in their apps.
Behind the scenes, CubiQo routes to the cheapest capable model.
Developers pay CubiQo, CubiQo pays providers. Margin = revenue.

### Architecture:

```
Developer's App
    ↓ POST /v1/chat/completions (OpenAI-compatible)
    ↓ Header: Authorization: Bearer cubk_xxxxxx
    ↓
CubiQo API Gateway (Vercel Edge Function)
    ↓ Validates CubiKey
    ↓ Classifies intent
    ↓ Selects cheapest model
    ↓ Routes to provider (Groq/OpenRouter/Anthropic/OpenAI)
    ↓ Tracks usage
    ↓
Response back to developer
```

### API Routes Needed:

```
POST   /api/v1/chat/completions    ← OpenAI-compatible endpoint (main product)
POST   /api/v1/embeddings          ← Embedding endpoint
GET    /api/v1/models              ← List available models

POST   /api/cubikey/create         ← Create new CubiKey
GET    /api/cubikey/usage          ← Check usage/billing
POST   /api/cubikey/topup          ← Add credits (Stripe)
DELETE /api/cubikey/revoke         ← Revoke a key
GET    /api/cubikey/dashboard      ← Usage dashboard data
```

### CubiKey Schema (Supabase):

```sql
CREATE TABLE cubikeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,        -- SHA256 of the key (never store raw)
  key_prefix TEXT NOT NULL,             -- "cubk_" + first 8 chars (for display)
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  credits_remaining_cents INT DEFAULT 100, -- Start with $1.00 free
  monthly_limit_cents INT DEFAULT 1000,    -- $10/month default cap
  rate_limit_rpm INT DEFAULT 60,           -- 60 requests/min
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false
);

CREATE TABLE cubikey_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cubikey_id UUID REFERENCES cubikeys(id),
  model_used TEXT NOT NULL,
  model_tier INT,
  input_tokens INT,
  output_tokens INT,
  cost_cents DECIMAL(10,4),
  latency_ms INT,
  intent_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pricing Strategy:
```
CubiKey charges: $1.00 / 1M tokens (flat, all models)
CubiQo actual cost:
  - Tier 1 (Groq free): $0.00 → 100% margin
  - Tier 2 (Mistral): $0.10 → 90% margin  
  - Tier 3 (Claude Sonnet): $3.00 → needs smart routing to stay profitable
  
Average blended cost: ~$0.20 / 1M tokens
Average revenue: $1.00 / 1M tokens
Gross margin: ~80%
```

### CubiKey Dashboard Page: `/cubikey`
- Create/manage API keys
- Usage graphs (requests, tokens, cost)
- Model breakdown (which models were used)
- Credit balance + top-up button
- Code examples (curl, Python, JavaScript)

---

## PART 4: ENV VARS NEEDED ON VERCEL

```
# Free tier providers
GROQ_API_KEY=gsk_xxxxx                    # Get free at console.groq.com
OPENROUTER_API_KEY=sk-or-xxxxx            # Get free at openrouter.ai

# Existing (already configured)
ANTHROPIC_API_KEY=xxxxx
OPENAI_API_KEY=xxxxx
EMERGENT_API_KEY=sk-emergent-xxxxx

# Optional
TOGETHER_API_KEY=xxxxx                     # together.ai
MISTRAL_API_KEY=xxxxx                      # console.mistral.ai

# Stripe (for CubiKey payments)
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
```

---

## EXECUTION ORDER

```
Phase 1: Smart Router (1-2 days)
  ├── Implement Groq provider (free Llama/Mixtral)
  ├── Implement OpenRouter provider  
  ├── Build intent classifier
  ├── Build model cascade
  ├── Wire into existing chat flow
  └── Test: verify 80% of requests go to free tier

Phase 2: Cost Engine (1 day)
  ├── Token tracking per request
  ├── Budget enforcement
  ├── Cost dashboard in /admin
  └── Daily/monthly spend alerts

Phase 3: CubiKey MVP (2-3 days)
  ├── OpenAI-compatible /v1/chat/completions endpoint
  ├── Key generation + validation
  ├── Usage tracking
  ├── Rate limiting
  ├── Dashboard page
  └── Stripe integration for credits

Phase 4: Polish (1 day)
  ├── Code examples (curl, Python, JS)
  ├── Developer docs at /docs/api
  ├── Onboarding flow
  └── Free tier: 100 requests/day with CubiKey
```

---

## TELL HENRY

> "Henry, read /root/clawd/thecubiqo/CUBIKEY_SPEC.md. This is the revenue product.
> Phase 1 first: wire Groq free tier into the chat so most requests cost $0.
> Then build CubiKey as an API product. Dev leads, you coordinate. Go."

---

*CubiKey: One key. All models. Near-free AI for everyone.*

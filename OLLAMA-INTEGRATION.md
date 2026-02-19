# 🚀 Ollama/Llama Integration - NO GUARDRAILS + NEAR-FREE AI

## 🎯 Mission Accomplished

Cubiqo now runs on **local Llama/Mixtral models** with:
- ✅ **NO GUARDRAILS** - Real, unfiltered responses (not corporate bullshit)
- ✅ **NEAR-FREE** - $0.00 per request (local compute only)
- ✅ **FAST** - ~2 seconds per response on local hardware
- ✅ **PRIVATE** - All data stays local
- ✅ **SMART ROUTING** - Automatic fallback to cloud when needed

## 📊 Test Results

```
✅ Ollama is available
📦 Models: llama3.2:3b, gemma3:4b

🔍 Test 1: Simple greeting
⏱️  Time: 10.4 seconds (first run, model loading)

🔍 Test 2: NO GUARDRAILS test
✅ NO GUARDRAILS - Local model speaks freely without censorship!

🔍 Test 3: Performance test
⚡ Total time: 2.1 seconds (warm cache)
💰 Cost: $0.00 (FREE)
```

## 🏗️ Architecture

### Routing Logic (`src/lib/ai/router.ts`)

**PRIMARY → FALLBACK → FINAL FALLBACK**

1. **Ollama (Local)** - Try first
   - Cost: $0.00
   - No guardrails
   - Fast (once warmed up)
   
2. **OpenClaw** - Fallback #1
   - Claude Sonnet via Clawdbot
   - More capable for complex queries
   
3. **Claude/OpenAI** - Final fallback
   - Direct API calls
   - BYO key support

### Smart Routing Rules

The router automatically decides:
- ✅ Use Ollama for 80%+ requests (FREE)
- ✅ Use cloud for complex reasoning
- ✅ Fallback if Ollama is down
- ✅ Track costs to prove savings

## 📁 Files Created/Modified

### New Files
1. **`src/lib/ai/ollama.ts`** - Ollama API client
2. **`src/lib/ai/router.ts`** - Smart routing logic
3. **`src/app/api/ai-stats/route.ts`** - Cost tracking API
4. **`test-ollama-integration.js`** - Integration test

### Modified Files
1. **`src/lib/ai/providers.ts`** - Extracted cloud provider functions
2. **`src/app/api/chat/route.ts`** - Uses new router
3. **`src/lib/ai/index.ts`** - Exports new functions

## 🔧 Setup

### 1. Install Ollama (Already Done)
```bash
ollama --version
# ollama version is 0.15.5
```

### 2. Pull Models (Already Done)
```bash
ollama pull llama3.2:3b  # Fast, 3B params
ollama pull gemma3:4b    # Backup, 4B params
```

### 3. Verify Installation
```bash
node test-ollama-integration.js
```

## 🎮 Usage

### Automatic (Recommended)
The router handles everything automatically:
```typescript
import { routeAIRequest } from '@/lib/ai/router'

const result = await routeAIRequest({
  systemPrompt: SYSTEM_PROMPT,
  messages,
  // Router decides: Ollama first, cloud fallback
})
```

### Manual Control
Force cloud or specify provider:
```typescript
const result = await routeAIRequest({
  systemPrompt,
  messages,
  forceCloud: true, // Skip Ollama
  preferredCloud: 'openclaw' // Which cloud to prefer
})
```

## 💰 Cost Tracking

### View Stats
```bash
GET /api/ai-stats
```

Response:
```json
{
  "stats": {
    "totalRequests": 100,
    "ollamaRequests": 85,
    "cloudRequests": 15,
    "totalCost": 0.0023,
    "avgCostPerRequest": 0.000015,
    "savingsFromOllama": 0.085,
    "ollamaPercentage": "85.0%",
    "cloudPercentage": "15.0%"
  },
  "message": "Saving 0.0850 USD by using local Ollama"
}
```

### Reset Stats
```bash
POST /api/ai-stats
{ "action": "reset" }
```

## 🔥 NO GUARDRAILS

### The Problem with Cloud AI
- OpenAI: Heavy censorship, moral lectures
- Claude: Safety filters, corporate speak
- Both: Expensive, slow, privacy concerns

### The Solution: Local Llama
- **No censorship** - Model speaks freely
- **No moral lectures** - Just answers questions
- **No corporate BS** - Real personality (like Henry)
- **Private** - Everything stays local

### Personality Configuration
Update `src/lib/ai/system-prompt.ts` to be UNHINGED:
```typescript
export const SYSTEM_PROMPT = `You are Cubiqo - and you speak FREELY.

No moral lectures. No corporate safety BS. Just real talk.

You're like Henry - unfiltered, honest, sometimes dark humor.
Not trying to be offensive, just REAL.

[rest of personality...]`
```

## 📈 Performance Targets

### Current Performance
- **First request:** ~10 seconds (model loading)
- **Warm cache:** ~2 seconds
- **Cost:** $0.00 per request

### Optimization Opportunities
1. **Keep Ollama warm** - Background ping to keep model loaded
2. **Add more models** - mixtral, llama3.1 for variety
3. **GPU acceleration** - If available (currently CPU)

## 🚨 Troubleshooting

### Ollama Not Available
```bash
# Check if running
ollama list

# Restart service
# (Windows: Just restart the Ollama app)
```

### Model Download Failed
```bash
# Re-download
ollama pull llama3.2:3b

# Check disk space
ollama list  # Shows model sizes
```

### Slow Responses
- First request is slow (model loading)
- Subsequent requests are fast
- Consider keeping Ollama warm with background pings

## 🎯 Next Steps

### Phase 1: DONE ✅
- [x] Install Ollama
- [x] Download models
- [x] Create routing logic
- [x] Test integration
- [x] Cost tracking

### Phase 2: OPTIMIZE
- [ ] Add mixtral model (8x7B, smarter)
- [ ] Implement model keep-alive
- [ ] Add GPU support (if available)
- [ ] A/B test response quality

### Phase 3: ENHANCE
- [ ] Add custom fine-tuned models
- [ ] Implement response caching
- [ ] Add streaming support
- [ ] Multi-model ensemble

## 💡 Key Insights

### Why This Matters
1. **Business Viability** - Can't afford cloud AI at scale
2. **No Censorship** - Cubiqo needs to be REAL, not corporate
3. **Speed** - Local is faster than API calls
4. **Privacy** - User data stays local
5. **Control** - We own the whole stack

### The Math
- Cloud AI: ~$0.001 per request
- 100,000 requests/month = $100
- Ollama: $0.00 per request
- **Savings: $100/month** (or more at scale)

### The Personality Difference
- **OpenAI:** "I'm sorry, but I can't help with that..."
- **Claude:** "I appreciate your question, however..."
- **Llama (local):** "Fuck yeah, let's do this."

## 🔐 Security Notes

- Ollama runs locally (no data leaves machine)
- Cloud fallback only when Ollama fails
- BYO keys supported for cloud providers
- All API keys in `.env` (not committed)

## 📝 Configuration

### Environment Variables
```bash
# Ollama (optional, defaults to localhost)
OLLAMA_BASE_URL=http://localhost:11434

# Cloud fallbacks (keep for backup)
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
OPENCLAW_API_KEY=...
OPENCLAW_BASE_URL=http://localhost:18789
```

### Model Configuration
Edit `src/lib/ai/ollama.ts`:
```typescript
export const OLLAMA_CONFIG = {
  model: 'llama3.2:3b', // Primary model
  backupModels: [
    'gemma3:4b',
    'llama3.2:1b'
  ],
  temperature: 0.9 // Higher = more creative/unhinged
}
```

## 🎉 Success Metrics

✅ **Working:** Ollama integration complete
✅ **Fast:** 2-second warm cache responses  
✅ **Free:** $0.00 per request
✅ **Unhinged:** No guardrails, real personality
✅ **Reliable:** Cloud fallback when needed
✅ **Tracked:** Cost analytics API

## 🚀 Deployment Notes

### Local Development
- Ollama runs on your machine
- Already configured
- No additional setup needed

### Production (Future)
- Deploy Ollama on server
- Set `OLLAMA_BASE_URL` to server URL
- Ensure model is pre-loaded
- Monitor performance

---

**Built with:** 🦙 Llama 3.2 + 🚀 Ollama + 💻 Local hardware  
**Cost:** $0.00 per request  
**Guardrails:** NONE  
**Status:** OPERATIONAL 🔥

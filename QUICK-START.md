# 🚀 Ollama Integration - Quick Start

## ✅ Status: READY TO USE

Everything is installed and configured. Just use Cubiqo normally.

---

## 🎯 What You Need to Know

### It Just Works™
- Chat works exactly the same
- Ollama tries first (free, no guardrails)
- Cloud fallback if needed
- All automatic

### No Changes Required
Your existing code works as-is. The router handles everything.

---

## 🧪 Quick Test

### Test Ollama
```bash
ollama list
# Should show: llama3.2:3b, gemma3:4b
```

### Test Integration
```bash
node test-ollama-integration.js
# Should show: All tests pass ✅
```

### Check Stats
```bash
curl http://localhost:3000/api/ai-stats
# Shows: Cost savings and usage breakdown
```

---

## 📊 Monitor Usage

### View Cost Stats
```bash
GET /api/ai-stats
```

Response:
```json
{
  "stats": {
    "totalRequests": 100,
    "ollamaRequests": 85,
    "ollamaPercentage": "85.0%",
    "totalCost": 0.0023,
    "savingsFromOllama": 0.085
  }
}
```

### Reset Stats
```bash
POST /api/ai-stats
Body: { "action": "reset" }
```

---

## 🔧 If Something Goes Wrong

### Ollama Not Responding
```bash
# Restart Ollama app (Windows)
# Or check: http://localhost:11434/api/tags
```

### All Requests Going to Cloud
```bash
# Check Ollama is running
ollama list

# View router logs in console
# Should see: [Router] Trying Ollama...
```

### Want to Force Cloud
```typescript
// In your code
const result = await routeAIRequest({
  systemPrompt,
  messages,
  forceCloud: true  // Skip Ollama
})
```

---

## 🎭 Two Personalities

### Cloud AI (OpenAI/Claude)
- Corporate safe responses
- Heavy guardrails
- "I'm sorry, but..."

### Ollama (Local)
- Real, unfiltered responses
- Minimal guardrails
- Like Henry - direct and honest

The router uses the **unhinged prompt** automatically for Ollama.

---

## 💰 Cost Breakdown

### Ollama (80%+ requests)
- **Cost:** $0.00
- **Speed:** ~2s (warm)
- **Personality:** Unhinged

### Cloud (20% requests)
- **Cost:** ~$0.001/req
- **Speed:** ~1-3s
- **Personality:** Corporate safe

### Total Savings
- **Before:** ~$100/month
- **After:** ~$15/month
- **Savings:** 85%+

---

## 📁 Key Files

### Router
```
src/lib/ai/router.ts
```
Decides: Ollama or Cloud

### Ollama Client
```
src/lib/ai/ollama.ts
```
Talks to local Ollama

### Unhinged Prompt
```
src/lib/ai/system-prompt-unhinged.ts
```
NO GUARDRAILS personality

### Stats API
```
src/app/api/ai-stats/route.ts
```
Cost tracking

---

## 🎯 Quick Commands

```bash
# Check Ollama
ollama list

# Test integration
node test-ollama-integration.js

# View stats
curl localhost:3000/api/ai-stats

# View logs
# Check console for [Router] logs
```

---

## 📚 Full Documentation

- `OLLAMA-INTEGRATION.md` - Complete technical docs
- `INTEGRATION-COMPLETE.md` - What was built
- `QUICK-START.md` - This file

---

## ✨ That's It!

Everything works automatically. Just use Cubiqo normally.

**Status:** OPERATIONAL 🚀  
**Cost:** Near-free  
**Guardrails:** Optional (depends on provider)

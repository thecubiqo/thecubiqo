# Cubiqo — Third-Party Integrations

**Last updated:** 2026-02-21  
**Research method:** Source-code audit (`src/`), `package.json`, `.env.example`, and existing documentation

---

## Overview

Cubiqo integrates with **34 third-party services** spanning AI/LLM providers, communication platforms, e-commerce, voice synthesis, email, authentication, infrastructure, and developer tooling. The table below is the canonical reference.

---

## 🤖 AI & LLM Providers

| # | Provider | Products / Models | Integration Status | Source / SDK |
|---|----------|-------------------|--------------------|--------------|
| 1 | **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude Haiku 4.5 | ✅ Implemented | `@anthropic-ai/sdk` · `src/lib/ai/llm-router.ts` · `src/lib/ai/policy-router.ts` |
| 2 | **OpenAI** | GPT-4, GPT-4o | ✅ Implemented | `openai` npm · `src/lib/ai/llm-router.ts` · `src/lib/ai/providers.ts` |
| 3 | **Google AI** | Gemini 2.5 Pro, Gemini 2.5 Flash | ✅ Implemented | `@google/generative-ai` · `src/lib/ai/llm-router.ts` |
| 4 | **MiniMax** | MiniMax M2.1 (abab6.5s) | ✅ Implemented (primary Green-path provider) | `src/lib/ai/minimax.ts` |
| 5 | **Mistral AI** | Mixtral 8x22B, Mistral Large, Codestral | ✅ Implemented | `src/lib/ai/llm-router.ts` · `src/lib/ai/policy-router.ts` |
| 6 | **DeepSeek** | DeepSeek V3, DeepSeek R1 | ✅ Implemented | `src/lib/ai/policy-router.ts` |
| 7 | **Groq** | Llama (fast inference), Whisper | ✅ Implemented | `src/lib/ai/llm-router.ts` |
| 8 | **Together AI** | Llama 3.3 70B (Yellow-path fallback) | ✅ Implemented | `src/lib/ai/policy-router.ts` |
| 9 | **OpenRouter** | Unified multi-model gateway | ✅ Implemented | `src/lib/ai/openrouter.ts` |
| 10 | **Ollama** | Local open-source models (Llama, Mixtral, etc.) | ✅ Implemented | `src/lib/ai/ollama.ts` |
| 11 | **OpenClaw / Emergent** | Legacy Claude proxy (Clawdbot AI Enhancement) | ✅ Implemented (legacy, still supported) | `src/lib/ai/openclaw.ts` · `src/lib/ai/providers/index.ts` |

**Model routing paths (from `src/lib/ai/policy-router.ts`):**

```
YELLOW:    Llama 3.3 70B  → Qwen Turbo → Haiku
GREEN:     MiniMax        → DeepSeek V3 → Gemini Pro → Opus
RED:       Mixtral 8x22B  → Llama Uncensored → Green fallback
REASONING: DeepSeek R1    → Opus
FOUNDER:   Claude 3.5 Sonnet (always)
```

---

## 💬 Chat & Communication

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 12 | **Telegram** | ✅ Implemented — full bot + webhook | `grammy` npm · `src/integrations/telegram/bot.ts` · `src/lib/integrations/telegram.ts` · `src/app/api/webhooks/telegram/route.ts` |
| 13 | **WhatsApp** | ✅ Implemented — message send/read/compose via browser automation | `src/lib/verbal-commands/whatsapp-service.ts` |
| 14 | **Discord** | ✅ Implemented — send/read/search via browser automation | `src/lib/verbal-commands/discord-service.ts` |
| 15 | **Gmail** | ✅ Implemented — send, read, compose; OAuth + Pub/Sub ready | `src/lib/verbal-commands/gmail-service.ts` · env: `GMAIL_CLIENT_ID/SECRET` |

---

## 🛒 E-Commerce & Print-on-Demand

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 16 | **Shopify** | ✅ Implemented — products, orders, webhooks (HMAC-verified), rate limiting | `src/integrations/shopify/` · env: `SHOPIFY_CLIENT_ID/SECRET` |
| 17 | **Printify** | ✅ Implemented — shop management, products, orders, blueprints, image upload; Shopify sync | `src/integrations/printify/` · env: `PRINTIFY_CLIENT_ID/SECRET` |
| 18 | **Printful** | ✅ OAuth credentials configured (Founders Pass) | env: `PRINTFUL_CLIENT_ID/SECRET` |
| 19 | **Stripe** | ✅ OAuth configured (Founders Pass payments) | env: `STRIPE_CLIENT_ID/SECRET` |

---

## 🚗 Transportation

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 20 | **Uber** | ✅ Implemented — ride booking via browser automation; OAuth configured | `src/lib/verbal-commands/uber-service.ts` · env: `UBER_CLIENT_ID/SECRET` |

---

## 🗺️ Maps & Location

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 21 | **Google Maps** | ✅ Implemented — search, directions, nearby search (via browser automation) | `src/lib/verbal-commands/maps-service.ts` |

---

## 🐦 Social Media

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 22 | **Twitter / X** | ✅ Implemented — post, read, search (via browser automation) | `src/lib/verbal-commands/twitter-service.ts` |

---

## 🔊 Voice & Audio

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 23 | **ElevenLabs** | ✅ Implemented — text-to-speech (TTS) | `src/hooks/useElevenLabsTTS.ts` · `src/lib/cq-to-cq/voice-synthesis.ts` · env: `ELEVENLABS_API_KEY` |

---

## 📧 Email Delivery

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 24 | **Resend** | ✅ Implemented — transactional emails, self-heal reports | `resend` npm · env: `RESEND_API_KEY` |

---

## 🔐 Authentication & Security

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 25 | **Supabase** | ✅ Core infrastructure — PostgreSQL, Auth (magic link, OAuth), Realtime, Storage | `@supabase/supabase-js` · `@supabase/ssr` |
| 26 | **SimpleWebAuthn** | ✅ Implemented — passkey / biometric authentication (FIDO2) | `@simplewebauthn/browser` + `@simplewebauthn/server` · `src/lib/webauthn/` |

---

## ☁️ Cloud & Deployment

| # | Provider | Integration Status | Source |
|---|----------|--------------------|--------|
| 27 | **Vercel** | ✅ Core deployment platform + Analytics + Speed Insights | `@vercel/analytics` · `@vercel/speed-insights` · `vercel.json` |
| 28 | **GitHub** | ✅ OAuth integration + API (PR triage, audit) | `@octokit/rest` · `src/app/api/admin/connections/github/` · env: `GITHUB_CLIENT_ID/SECRET` |

---

## 🗄️ Infrastructure & Data

| # | Provider / Library | Integration Status | Source |
|---|--------------------|--------------------|--------|
| 29 | **Redis** (ioredis) | ✅ Implemented — rate limiting, spending caps, session storage | `ioredis` npm · `src/lib/rate-limit.ts` · `src/lib/engine/session-redis.ts` |
| 30 | **Docker** (via Dockerode) | ✅ Implemented — isolated code execution workspaces (Emergent engine) | `dockerode` npm · `src/lib/emergent/runner/docker-manager.ts` |
| 31 | **Puppeteer / Chromium** | ✅ Implemented — browser automation for verbal commands (WhatsApp, Discord, Uber, Maps, Twitter) | `puppeteer` npm · `src/lib/browser/browser-service.ts` · `src/lib/browser/BrowserPool.ts` |

---

## 🛠️ Developer Tooling (Runtime)

| # | Tool | Integration Status | Source |
|---|------|--------------------|--------|
| 32 | **Monaco Editor** | ✅ Embedded in-app code editor (Dev Console, Studio) | `@monaco-editor/react` · `monaco-editor` npm |
| 33 | **xterm.js** | ✅ In-app terminal emulator (Studio, Dev Console) | `@xterm/xterm` · `@xterm/addon-fit` npm |
| 34 | **Storybook** | ✅ Component development and documentation | `.storybook/` config |

---

## Summary by Category

| Category | Count | Status |
|----------|-------|--------|
| AI / LLM Providers | 11 | ✅ All implemented |
| Chat & Communication | 4 | ✅ All implemented |
| E-Commerce & Print | 4 | ✅ Shopify + Printify full; Printful + Stripe OAuth configured |
| Transportation | 1 | ✅ Implemented |
| Maps | 1 | ✅ Implemented |
| Social Media | 1 | ✅ Implemented |
| Voice & Audio | 1 | ✅ Implemented |
| Email Delivery | 1 | ✅ Implemented |
| Auth & Security | 2 | ✅ Implemented |
| Cloud & Deployment | 2 | ✅ Core infrastructure |
| Infrastructure & Data | 3 | ✅ Implemented |
| Developer Tooling | 3 | ✅ Implemented |
| **Total** | **34** | |

---

## Environment Variables Reference

All integration keys are configured via environment variables. See `.env.example` for the complete template.

| Variable | Integration |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI (GPT, DALL-E) |
| `GOOGLE_AI_API_KEY` | Google AI (Gemini) |
| `MINIMAX_API_KEY` / `MINIMAX_KEY` | MiniMax |
| `MISTRAL_API_KEY` | Mistral AI |
| `GROQ_API_KEY` | Groq |
| `TOGETHER_API_KEY` | Together AI |
| `OPENROUTER_API_KEY` / `OPENROUTER_KEY` | OpenRouter |
| `OPENROUTER_KEY_CUBIKEY` / `OPENCLAW_API_KEY` | OpenClaw / CubiKey |
| `EMERGENT_API_KEY` + `EMERGENT_BASE_URL` | Emergent (legacy proxy) |
| `OLLAMA_BASE_URL` | Ollama (local) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS |
| `RESEND_API_KEY` | Resend email |
| `NEXT_PUBLIC_SUPABASE_URL` + keys | Supabase |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `NEXT_PUBLIC_VERCEL_CLIENT_ID` + `VERCEL_CLIENT_SECRET` | Vercel OAuth |
| `GMAIL_CLIENT_ID` + `GMAIL_CLIENT_SECRET` | Gmail OAuth |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | Shopify OAuth |
| `PRINTIFY_CLIENT_ID` + `PRINTIFY_CLIENT_SECRET` | Printify OAuth |
| `PRINTFUL_CLIENT_ID` + `PRINTFUL_CLIENT_SECRET` | Printful OAuth |
| `STRIPE_CLIENT_ID` + `STRIPE_CLIENT_SECRET` | Stripe OAuth |
| `UBER_CLIENT_ID` + `UBER_CLIENT_SECRET` | Uber OAuth |
| `ENCRYPTION_KEY` / `OAUTH_ENCRYPTION_KEY` | OAuth token encryption (at-rest) |

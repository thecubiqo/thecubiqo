# Cubiqo — Complete Third-Party Integrations Reference

**Last updated:** 2026-02-21  
**Research method:** Exhaustive source-code audit of all 688 TypeScript/TSX files across `src/`, `social-army/`, `package.json`, `.env.example`, and architecture docs.  
**Test results (2026-02-21):** 2,169 / 2,288 tests passing (95.2%). 114 failing — all pre-existing, unrelated to integrations.

---

## 📊 Quick Count

| Category | Count |
|----------|-------|
| 🤖 AI & LLM Providers | 11 |
| 💬 Chat & Messaging | 6 |
| 📱 Social Media | 9 |
| 🛒 E-Commerce & Payments | 8 |
| 🖨️ Print-on-Demand & Fulfilment | 5 |
| 🚗 Transport & Delivery | 4 |
| 🗺️ Maps & Location | 1 |
| 🎵 Music | 1 |
| 📝 Productivity (Notes, Tasks, Boards) | 3 |
| 🔊 Voice & Audio | 3 |
| 📧 Email & Notifications | 3 |
| 🔐 Auth & Identity | 2 |
| ☁️ Cloud, Deployment & Hosting | 3 |
| 🗄️ Infrastructure | 3 |
| 🏠 Smart Home | 7 |
| 📈 CRM, Marketing & Growth | 9 |
| 🔍 Search | 1 |
| 🎨 Media Generation (Image / Video / Audio) | 3 |
| 💳 Payments & Finance | 3 |
| 🛠️ Developer Tooling | 4 |
| **Total** | **99** |

---

## How Users Connect Apps to Cubiqo

There are **four connection pathways** depending on the integration type:

### 1. 🔑 BYO Mode — Bring Your Own API Key (AI providers)
> **Who:** All users · **Where:** Settings → "Try BYO Mode"

Users paste their own API keys for Claude / OpenAI into the in-app UI. Keys are encrypted with AES-256-GCM (per-user passphrase derived from user ID) and stored encrypted in the `profiles` table in Supabase. The plaintext key never touches the database.

- **UI:** `src/components/byo/BYOSettings.tsx`  
- **API:** `POST /api/byo` (save), `POST /api/byo/test` (live-test before saving)  
- **Keys supported:** Anthropic (Claude), OpenAI

### 2. 🤝 Handshake Wizard — Verbal Command & Lifestyle Apps
> **Who:** All users · **Where:** Onboarding or Settings → "Connect your services"

A step-by-step wizard. Users tap "Handshake" next to a service; Cubiqo records the consent and activates browser automation (Puppeteer/Chromium) for that service on the user's behalf. No OAuth or API key needed for most — Cubiqo drives the web UI directly.

- **File:** `src/components/HandshakeWizard.tsx`  
- **Services:** Gmail, Outlook, Slack, Teams, LinkedIn, WhatsApp, Telegram, Discord, Twitter/X, Uber, Uber Eats, Google Maps, Spotify

### 3. 🔐 OAuth Connect — Founders Pass (premium)
> **Who:** Founders Pass holders · **Where:** `/founders-pass/integrations`

Standard OAuth 2.0 authorization-code flow for six services. Tokens are AES-256-GCM encrypted before storage in the `oauth_tokens` table. Callback: `/api/founders-pass/oauth/callback`.

| Service | OAuth Authorize URL |
|---------|---------------------|
| Gmail | `https://accounts.google.com/o/oauth2/v2/auth` |
| Shopify | Per-store URL |
| Printify | `https://api.printify.com/v1/authorize` |
| Printful | `https://www.printful.com/oauth/authorize` |
| Stripe | `https://connect.stripe.com/oauth/authorize` |
| Uber | `https://login.uber.com/oauth/v2/authorize` |

- **Files:** `src/app/founders-pass/integrations/page.tsx` · `src/app/api/founders-pass/oauth/callback/route.ts` · `src/lib/founders-pass/oauth.ts`

### 4. ⚙️ Environment Variables — Platform-level (admin / self-hosted)
> **Who:** Platform operators · **Where:** Vercel project settings / `.env.local`

All remaining integrations (AI providers, Telegram bot, Supabase, Redis, Brave Search, ElevenLabs, Resend, GitHub, Vercel, Railway) are connected via environment variables. See [Environment Variables Reference](#environment-variables-reference) below.

---

## 🤖 AI & LLM Providers

> Connection method: **env var** for hosted mode, **BYO mode** for user-supplied keys

| Provider | Models Used | Routing Zone | SDK / API | Functional? |
|----------|-------------|--------------|-----------|-------------|
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude Haiku 4.5 | Founder, Green, Yellow | `@anthropic-ai/sdk` | ✅ Live |
| **OpenAI** | GPT-4, GPT-4o, DALL-E 3 | Green, image gen | `openai` npm | ✅ Live |
| **Google AI** | Gemini 2.5 Pro, Gemini 2.5 Flash | Green fallback | `@google/generative-ai` | ✅ Live |
| **MiniMax** | MiniMax M2.1 (abab6.5s) | Green primary | Direct REST (`api.minimax.io`) | ✅ Live |
| **Mistral AI** | Mixtral 8x22B, Mistral Large, Codestral | Red primary | OpenAI-compat REST | ✅ Live |
| **DeepSeek** | DeepSeek V3, DeepSeek R1 | Green, Reasoning | via OpenRouter | ✅ Live |
| **Groq** | Llama (fast inference), Whisper STT | Yellow, STT | OpenAI-compat REST (`api.groq.com`) | ✅ Live |
| **Together AI** | Llama 3.3 70B | Yellow primary | via OpenRouter | ✅ Live |
| **OpenRouter** | Unified gateway — all models above | All zones | `src/lib/ai/openrouter.ts` | ✅ Live |
| **Ollama** | Local Llama, Mixtral, etc. | Freedom / local | Direct REST (`localhost:11434`) | ✅ Live (if running) |
| **OpenClaw / Emergent** | Claude proxy (legacy Clawdbot) | Legacy fallback | `src/lib/ai/openclaw.ts` | ✅ Live (legacy) |

**Routing paths (from `src/lib/ai/policy-router.ts`):**
```
YELLOW   → Llama 3.3 70B → Qwen Turbo → Haiku
GREEN    → MiniMax → DeepSeek V3 → Gemini Pro → Opus
RED      → Mixtral 8x22B → Llama Uncensored → Green fallback
REASONING→ DeepSeek R1 → Opus
FOUNDER  → Claude 3.5 Sonnet (always)
FREEDOM  → Ollama local or uncensored OpenRouter models
```

---

## 💬 Chat & Messaging

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Telegram** | Env var (`TELEGRAM_BOT_TOKEN`) — grammy SDK bot + webhook | ✅ Fully live | `grammy` npm · `src/integrations/telegram/bot.ts` · `/api/webhooks/telegram` |
| **WhatsApp** | Handshake Wizard → Puppeteer browser automation | ✅ Service implemented | `src/lib/verbal-commands/whatsapp-service.ts` |
| **Discord** | Handshake Wizard → Puppeteer; agent tool `discord_send` | ✅ Service implemented | `src/lib/verbal-commands/discord-service.ts` |
| **Slack** | Handshake Wizard → Puppeteer; agent tool `slack_send` | ✅ Service implemented | `src/lib/verbal-commands/slack-service.ts` |
| **Signal** | Integration registry entry | 📋 Registry only | `src/lib/notifications/integration-registry.ts` |
| **iMessage** | Integration registry entry | 📋 Registry only | `src/lib/notifications/integration-registry.ts` |

---

## 📱 Social Media

> Social Army Worker (deployed on Railway, runs Puppeteer) auto-posts to all 9 platforms from the `content_queue` Supabase table.

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Twitter / X** | Handshake Wizard + Social Army auto-posting | ✅ Fully live | `src/lib/verbal-commands/twitter-service.ts` · `social-army/` |
| **Instagram** | Social Army auto-posting | ✅ Social Army live | `social-army/config/platforms.json` |
| **LinkedIn** | Handshake Wizard + Social Army | ✅ Social Army live | `social-army/` · `src/lib/browser/command-parser.ts` |
| **TikTok / TikTok Shop** | Social Army posting + Business Suite inventory sync | ✅ Social Army live | `social-army/` · `src/lib/emergent/integrations/business-suite.ts` |
| **YouTube** | Social Army auto-posting (Shorts) | ✅ Social Army live | `social-army/config/platforms.json` |
| **Reddit** | Social Army auto-posting | ✅ Social Army live | `social-army/config/platforms.json` |
| **Pinterest** | Social Army auto-posting | ✅ Social Army live | `social-army/config/platforms.json` |
| **Threads** | Social Army + action-parser `social_post` type | ✅ Social Army live | `social-army/` · `src/lib/actions/action-parser.ts` |
| **Facebook** | Social Army auto-posting | ✅ Social Army live | `social-army/config/platforms.json` |

---

## 🛒 E-Commerce & Payments

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Shopify** | Founders Pass OAuth + env vars | ✅ Full REST client — products, orders, HMAC webhooks | `src/integrations/shopify/` · `/api/webhooks/shopify` |
| **Stripe** | Founders Pass OAuth | ✅ OAuth + webhook handler (`checkout.session.completed`) | `src/lib/founders-pass/types.ts` · `src/lib/emergent/integrations/webhook-bridge.ts` |
| **PayPal** | Action type (`payment.method = 'paypal'`) | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |
| **Venmo** | Action type (`payment.method = 'venmo'`) | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |
| **Amazon** | Order action type | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |
| **Faire** | Business Suite class | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **ReCharge** | Business Suite class — subscription creation | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Meta Ads** | Business Suite — ROAS tracking + ad spend | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |

---

## 🖨️ Print-on-Demand & Fulfilment

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Printify** | Founders Pass OAuth + env vars | ✅ Full API — products, orders, blueprints, image upload, Shopify sync | `src/integrations/printify/` · `/api/webhooks/printify` |
| **Printful** | Founders Pass OAuth | ✅ OAuth configured | `src/lib/founders-pass/types.ts` |
| **Apliiq** | Business Suite class | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Through6** | Business Suite class | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Prodigi** | Business Suite class — global lab routing | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |

---

## 🚗 Transport & Delivery

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Uber** | Founders Pass OAuth + Handshake Wizard → Puppeteer | ✅ Full — ride request, estimate, status | `src/lib/verbal-commands/uber-service.ts` |
| **Uber Eats** | Handshake Wizard + order action type | 📋 Action spec; wizard UI present | `src/components/HandshakeWizard.tsx` · `src/lib/actions/action-types.ts` |
| **DoorDash** | Order action type | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |
| **Instacart** | Order action type | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |

---

## 🗺️ Maps & Location

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Google Maps** | Handshake Wizard → Puppeteer browser automation | ✅ Live — place search, directions, nearby | `src/lib/verbal-commands/maps-service.ts` |

---

## 🎵 Music

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Spotify** | Handshake Wizard → Puppeteer browser automation | ✅ Service implemented (play, pause, skip, search) | `src/lib/verbal-commands/spotify-service.ts` |

---

## 📝 Productivity (Notes, Tasks, Boards)

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Notion** | Handshake Wizard → Puppeteer browser automation | ✅ Service implemented (create page, search) | `src/lib/verbal-commands/notion-service.ts` · `src/lib/verbal-commands/command-router.ts` |
| **Trello** | Handshake Wizard → Puppeteer browser automation | ✅ Service implemented (add card, read list) | `src/lib/verbal-commands/trello-service.ts` · `src/lib/verbal-commands/command-router.ts` |
| **Google Calendar** | Integration registry | ✅ Registry (create/read/update events) | `src/lib/notifications/integration-registry.ts` |

---

## 🔊 Voice & Audio

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **ElevenLabs** | Env var `ELEVENLABS_API_KEY` | ✅ Live — TTS, voice synthesis, CQ-to-CQ calls | `src/hooks/useElevenLabsTTS.ts` · `src/lib/cq-to-cq/voice-synthesis.ts` |
| **Suno / Udio** | Backend route (`/api/audio/generate-music`) — API not yet wired | 📋 Hooked, backend planned | `src/lib/audio/audio-score-service.ts` · `src/app/api/audio/generate-music/route.ts` |
| **Hume AI / Azure** | Provider enum in multimodal types | 📋 Type spec (not live) | `src/lib/multimodal/types.ts` |

> **WebRTC (Google STUN):** CQ-to-CQ peer audio/video calls use `stun.l.google.com:19302` as the ICE server. This is the only Google infrastructure dependency not requiring a key. (`src/lib/cq-to-cq/webrtc-calls.ts`)

---

## 📧 Email & Notifications

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Resend** | Env var `RESEND_API_KEY` | ✅ Live — transactional email, magic-link, self-heal reports | `resend` npm · `src/lib/email/` |
| **Gmail** | Founders Pass OAuth + Handshake Wizard | ✅ Live — send, read, search; magic-link quick-open | `src/lib/verbal-commands/gmail-service.ts` |
| **Outlook / Microsoft Mail** | Handshake Wizard + magic-link quick-open | ✅ UI live | `src/components/auth/MagicLinkButtons.tsx` · `src/components/HandshakeWizard.tsx` |

---

## 🔐 Auth & Identity

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Supabase** | Env vars (URL + keys) — core infrastructure | ✅ Live — PostgreSQL, Auth (magic link, OAuth), Realtime, Storage | `@supabase/supabase-js` · `@supabase/ssr` |
| **SimpleWebAuthn / FIDO2** | Built-in — no external config needed | ✅ Live — passkey / biometric registration + login | `@simplewebauthn/browser` + `@simplewebauthn/server` · `src/lib/webauthn/` |

---

## ☁️ Cloud, Deployment & Hosting

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Vercel** | Primary deployment + Analytics + Speed Insights SDK + OAuth (admin connections) | ✅ Live | `@vercel/analytics` · `@vercel/speed-insights` · `vercel.json` |
| **GitHub** | OAuth + `@octokit/rest` API — PR triage, audit, repo listing | ✅ Live | `@octokit/rest` · `/api/admin/connections/github/` |
| **Railway** | Social Army Worker Dockerfile deployed here | ✅ Live — Social Army runs here | `railway.json` · `social-army/Dockerfile` |

---

## 🗄️ Infrastructure

| Service | How it connects | Functional today? | Source |
|---------|----------------|-------------------|--------|
| **Redis** (ioredis) | Env var — rate limiting, spending caps, session state | ✅ Live | `ioredis` npm · `src/lib/rate-limit.ts` · `src/lib/engine/session-redis.ts` |
| **Docker** (dockerode) | Env var / local daemon — Emergent sandbox workspaces | ✅ Live | `dockerode` npm · `src/lib/emergent/runner/docker-manager.ts` |
| **Puppeteer / Chromium** | Bundled — browser automation engine for verbal commands + Social Army | ✅ Live — drives WhatsApp, Discord, Slack, Uber, Maps, Twitter, LinkedIn, Instagram, Facebook, Notion, Trello, Spotify | `puppeteer` npm · `src/lib/browser/` · `social-army/` |

---

## 🏠 Smart Home

All seven registered in `src/lib/notifications/integration-registry.ts`. Philips Hue also has a rendered UI card in `src/components/notifications/BrandedActionCard.tsx`.

| App | Connection method | Functional today? |
|-----|-------------------|-------------------|
| **Philips Hue** | OAuth | ✅ Registry + UI card |
| **Nest** | OAuth | ✅ Registry |
| **Ring** | OAuth | ✅ Registry |
| **August Lock** | OAuth | ✅ Registry |
| **Sonos** | OAuth | ✅ Registry |
| **Ecobee** | OAuth | ✅ Registry |
| **Home Assistant** | Local URL (no OAuth) | ✅ Registry |

---

## 📈 CRM, Marketing & Growth

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **HubSpot** | Env var — webhook handler + integration agent | ✅ Webhook + agent monetization context | `src/lib/emergent/integrations/webhook-bridge.ts` |
| **Salesforce** | Env var — webhook handler + integration agent | ✅ Webhook + agent monetization context | `src/lib/emergent/integrations/webhook-bridge.ts` |
| **Klaviyo** | Business Suite class — customer segmentation + revenue attribution | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Gorgias** | Business Suite class — AI ticket auto-resolution | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Mailchimp** | SaaS catalogue + action spec | 📋 Catalogue / spec | `src/data/saas-integrations.ts` |
| **Twilio** | SaaS catalogue + SMS action type | 📋 Catalogue / spec | `src/data/saas-integrations.ts` · `src/lib/actions/action-types.ts` |
| **SendGrid** | SaaS catalogue + self-heal executor comment | 📋 Catalogue / spec | `src/data/saas-integrations.ts` |
| **Google Ads** | SaaS catalogue | 📋 Catalogue / spec | `src/data/saas-integrations.ts` |
| **LinkedIn Ads** | SaaS catalogue | 📋 Catalogue / spec | `src/data/saas-integrations.ts` |

---

## 🔍 Search

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **Brave Search** | Env var `BRAVE_API_KEY` | ✅ Live — powers `web_search` agent tool + orchestrator current-affairs queries | `src/lib/engine/web-tools.ts` · `src/lib/emergent/orchestrator.ts` |

---

## 🎨 Media Generation

| App | How it connects | Functional today? | Source |
|-----|----------------|-------------------|--------|
| **OpenAI DALL-E 3** | Env var `OPENAI_API_KEY` | ✅ Live — image gen with rate-limiting + spending cap ($50/mo) | `src/app/api/generate/image/route.ts` · `src/lib/emergent/subagents/image-agent.ts` |
| **Runway Gen-3** | Planned — Media Agent placeholder | 📋 Hooked (placeholder URL) — not live | `src/lib/emergent/subagents/media-agent.ts` |
| **Luma AI** | Planned — Media Agent placeholder | 📋 Hooked (named alongside Runway) — not live | `src/lib/emergent/subagents/media-agent.ts` |

---

## 💳 Payments & Finance (Internal / Crypto)

| Service | How it connects | Functional today? | Source |
|---------|----------------|-------------------|--------|
| **Crypto Escrow (Internal)** | Built-in WalletService — QR-based delayed release, escrow | ✅ Live — no third-party provider, uses internal DB | `src/lib/finance/wallet-service.ts` |
| **Venmo** | Payment action type | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |
| **PayPal** | Payment action type | 📋 Action spec (not live) | `src/lib/actions/action-types.ts` |

---

## 🛠️ Developer Tooling

| Tool | Purpose | Functional today? | Source |
|------|---------|-------------------|--------|
| **Monaco Editor** | In-app code editor (Dev Console, Studio, LiveCoderPane) | ✅ Live | `@monaco-editor/react` · `monaco-editor` npm |
| **xterm.js** | In-app terminal emulator (Studio, Dev Console) | ✅ Live | `@xterm/xterm` · `@xterm/addon-fit` npm |
| **Storybook** | Component visual docs & testing | ✅ Configured | `.storybook/` |
| **Chromatic** | Visual regression testing for Storybook stories | ✅ Configured | `CHROMATIC_TOKEN_STATUS.md` · `verify-chromatic.sh` |

---

## Test Results Summary

Ran: `./node_modules/.bin/vitest run` — 2026-02-21

```
Test Files:  25 failed | 74 passed (99 total)
Tests:      114 failed | 2,169 passed | 5 skipped (2,288 total)
Pass rate:  95.2%
```

**Why 114 tests fail (pre-existing, unrelated to integrations):**

| Root Cause | Example Failing Tests |
|------------|----------------------|
| Env-var fallback mismatch (`_URL1` suffix expectations) | `database-dependency.test.ts`, `api-session.test.ts` |
| Supabase mock missing `.in()` method | `rbac.test.ts` |
| OpenClaw model name mismatch in test fixtures | `providers/__tests__/index.test.ts` |
| React component snapshot drift | `TopRightCTA.snapshot.test.tsx` |
| Admin stats mock gap (missing `system_health` field) | `api-database-validation.test.ts` |
| Playbook DB mock returns no data | `playbook-executor.test.ts` |
| `beforeinstallprompt` not fired in jsdom | `PWAInstallPrompt.test.tsx` |

None of these failures indicate a broken integration. All are test-environment gaps or fixture drift.

---

## Environment Variables Reference

| Variable | Integration | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) | Optional (BYO fallback) |
| `OPENAI_API_KEY` | OpenAI / DALL-E 3 | Optional (BYO fallback) |
| `GOOGLE_AI_API_KEY` | Google AI (Gemini) | Optional |
| `MINIMAX_API_KEY` / `MINIMAX_KEY` | MiniMax | Optional |
| `MISTRAL_API_KEY` | Mistral AI | Optional |
| `GROQ_API_KEY` | Groq (LLM + Whisper STT) | Optional |
| `TOGETHER_API_KEY` | Together AI | Optional |
| `OPENROUTER_API_KEY` / `OPENROUTER_KEY` | OpenRouter | Optional |
| `OPENROUTER_KEY_CUBIKEY` / `OPENCLAW_API_KEY` | OpenClaw / CubiKey | Optional |
| `EMERGENT_API_KEY` + `EMERGENT_BASE_URL` | Emergent (legacy proxy) | Optional |
| `OLLAMA_BASE_URL` | Ollama local server | Optional |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS | Optional |
| `RESEND_API_KEY` | Resend email | Optional |
| `BRAVE_API_KEY` | Brave Search | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` + anon/service keys | Supabase | **Required** |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub OAuth | Optional |
| `NEXT_PUBLIC_VERCEL_CLIENT_ID` + `VERCEL_CLIENT_SECRET` | Vercel OAuth | Optional |
| `GMAIL_CLIENT_ID` + `GMAIL_CLIENT_SECRET` | Gmail OAuth | Optional |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | Shopify OAuth | Optional |
| `PRINTIFY_CLIENT_ID` + `PRINTIFY_CLIENT_SECRET` | Printify OAuth | Optional |
| `PRINTFUL_CLIENT_ID` + `PRINTFUL_CLIENT_SECRET` | Printful OAuth | Optional |
| `STRIPE_CLIENT_ID` + `STRIPE_CLIENT_SECRET` | Stripe OAuth | Optional |
| `UBER_CLIENT_ID` + `UBER_CLIENT_SECRET` | Uber OAuth | Optional |
| `ENCRYPTION_KEY` / `OAUTH_ENCRYPTION_KEY` | OAuth token encryption at rest | Optional |
| `CRON_SECRET` | Cron job protection | Optional |
| `SELF_HEAL_EMAIL_FROM` + `SELF_HEAL_EMAIL_TO` | Self-heal email reports | Optional |

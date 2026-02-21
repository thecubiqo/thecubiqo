# Cubiqo — Third-Party App Integrations

**Last updated:** 2026-02-21  
**Research method:** Exhaustive source-code audit of all 688 TypeScript/TSX files across `src/`, `social-army/`, `package.json`, `.env.example`, and existing architecture docs.  
**Scope:** All non-AI third-party apps and services only.

---

## 📊 Quick Count

| Category | Apps |
|----------|------|
| 💬 Chat & Messaging | 6 |
| 📱 Social Media | 9 |
| 🛒 E-Commerce & Payments | 8 |
| 🖨️ Print-on-Demand & Fulfilment | 5 |
| 🚗 Transport & Delivery | 3 |
| 🗺️ Maps & Location | 1 |
| 🔊 Voice & Audio | 3 |
| 📧 Email & Notifications | 3 |
| 🔐 Auth & Identity | 2 |
| ☁️ Cloud, Deployment & Hosting | 3 |
| 🗄️ Infrastructure | 3 |
| 🏠 Smart Home | 7 |
| 📈 CRM, Marketing & Growth | 9 |
| 🔍 Search | 1 |
| 🎨 Media Generation | 3 |
| 🛠️ Developer Tooling | 4 |
| **Total** | **71** |

---

## 💬 Chat & Messaging

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Telegram** | Bot (grammy SDK) + webhook receiver | ✅ Fully implemented | `grammy` npm · `src/integrations/telegram/bot.ts` · `src/app/api/webhooks/telegram/route.ts` |
| **WhatsApp** | Browser automation (Puppeteer) — send, read, compose | ✅ Service implemented | `src/lib/verbal-commands/whatsapp-service.ts` |
| **Discord** | Browser automation — send, read, search; agent tool `discord_send` | ✅ Service implemented | `src/lib/verbal-commands/discord-service.ts` · `src/lib/notifications/integration-registry.ts` |
| **Slack** | Browser automation — send, read; agent tool `slack_send` | ✅ Service implemented | `src/lib/verbal-commands/slack-service.ts` · `src/lib/notifications/integration-registry.ts` |
| **Signal** | Registered in integration registry | 📋 Registry / spec | `src/lib/notifications/integration-registry.ts` |
| **iMessage** | Registered in integration registry | 📋 Registry / spec | `src/lib/notifications/integration-registry.ts` |

---

## 📱 Social Media

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Twitter / X** | Browser automation — post, read, search; Social Army automated posting | ✅ Fully implemented | `src/lib/verbal-commands/twitter-service.ts` · `social-army/config/platforms.json` |
| **Instagram** | Browser automation + Social Army posting | ✅ Service + Social Army | `src/lib/notifications/integration-registry.ts` · `social-army/config/platforms.json` |
| **LinkedIn** | Browser automation + Social Army posting | ✅ Service + Social Army | `src/lib/browser/command-parser.ts` · `social-army/config/platforms.json` |
| **TikTok / TikTok Shop** | Social Army posting; Business Suite inventory sync | ✅ Social Army + Business Suite | `social-army/config/platforms.json` · `src/lib/emergent/integrations/business-suite.ts` |
| **YouTube** | Social Army posting (YouTube Shorts) | ✅ Social Army | `social-army/config/platforms.json` |
| **Reddit** | Social Army posting | ✅ Social Army | `social-army/config/platforms.json` |
| **Pinterest** | Social Army posting | ✅ Social Army | `social-army/config/platforms.json` |
| **Threads** | Social Army + action-parser social posting | ✅ Social Army + Actions | `social-army/config/platforms.json` · `src/lib/actions/action-parser.ts` |
| **Facebook** | Browser automation + Social Army posting | ✅ Service + Social Army | `src/lib/notifications/integration-registry.ts` · `social-army/config/platforms.json` |

> **Social Army Worker** (`social-army/`) is a background service deployed on Railway. It runs Puppeteer to drive automated content posting to all 9 platforms above from a `content_queue` table in Supabase.

---

## 🛒 E-Commerce & Payments

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Shopify** | Full REST API client — products, orders, webhooks (HMAC-SHA256 verified), inventory, rate limiting | ✅ Fully implemented | `src/integrations/shopify/` · `src/lib/integrations/shopify.ts` · `src/app/api/webhooks/shopify/` · env: `SHOPIFY_CLIENT_ID/SECRET` |
| **Stripe** | OAuth Connect flow — checkout webhook handler (`checkout.session.completed`), revenue sync | ✅ OAuth + webhook handler | `src/lib/founders-pass/types.ts` · `src/lib/emergent/integrations/webhook-bridge.ts` · env: `STRIPE_CLIENT_ID/SECRET` |
| **PayPal** | Payment action type (action-types) | 📋 Action spec | `src/lib/actions/action-types.ts` |
| **Venmo** | Payment action type (action-types) | 📋 Action spec | `src/lib/actions/action-types.ts` |
| **Amazon** | Order action type — ordering, delivery | 📋 Action spec | `src/lib/actions/action-types.ts` |
| **Faire** | Wholesale marketplace — catalog publishing (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **ReCharge** | Subscription billing — subscription creation (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Meta Ads** | ROAS tracking + ad spend aggregation (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |

---

## 🖨️ Print-on-Demand & Fulfilment

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Printify** | Full API client — shops, products, orders, blueprints, print-providers, image upload; Shopify sync | ✅ Fully implemented | `src/integrations/printify/` · `src/lib/integrations/printify.ts` · `src/app/api/webhooks/printify/` · env: `PRINTIFY_CLIENT_ID/SECRET` |
| **Printful** | OAuth Connect flow (Founders Pass) | ✅ OAuth configured | `src/lib/founders-pass/types.ts` · env: `PRINTFUL_CLIENT_ID/SECRET` |
| **Apliiq** | Luxury cut-and-sew garments with woven labels (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Through6** | Full-print sublimation / cut-and-sew (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Prodigi** | Global fine art & premium object fulfilment (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |

---

## 🚗 Transport & Delivery

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Uber** | Browser automation — ride request, fare estimate, status; full OAuth flow | ✅ Fully implemented | `src/lib/verbal-commands/uber-service.ts` · `src/lib/founders-pass/types.ts` · env: `UBER_CLIENT_ID/SECRET` |
| **Uber Eats** | Order action type; registered in HandshakeWizard | 📋 Action spec + wizard | `src/lib/actions/action-types.ts` · `src/components/HandshakeWizard.tsx` |
| **DoorDash** | Order action type | 📋 Action spec | `src/lib/actions/action-types.ts` |
| **Instacart** | Order action type | 📋 Action spec | `src/lib/actions/action-types.ts` |

---

## 🗺️ Maps & Location

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Google Maps** | Browser automation — place search, directions, nearby search | ✅ Implemented | `src/lib/verbal-commands/maps-service.ts` |

---

## 🔊 Voice & Audio

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **ElevenLabs** | REST API — text-to-speech (TTS), voice synthesis, CQ-to-CQ calls | ✅ Fully implemented | `src/hooks/useElevenLabsTTS.ts` · `src/lib/cq-to-cq/voice-synthesis.ts` · env: `ELEVENLABS_API_KEY` |
| **Suno / Udio** | Music & singing generation (mock hook in audio service; production backend planned) | 📋 Hooked, not live | `src/lib/audio/audio-score-service.ts` · `src/app/api/audio/generate-music/route.ts` |
| **Hume AI / Azure** | Emotion-aware voice provider (type-system level, provider enum) | 📋 Type spec | `src/lib/multimodal/types.ts` |

---

## 📧 Email, SMS & Notifications

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Resend** | REST API — transactional email, magic-link auth emails, self-heal reports | ✅ Fully implemented | `resend` npm · `src/lib/email/` · env: `RESEND_API_KEY` |
| **Gmail** | OAuth + REST — compose, read, search; magic-link quick-open; agent tool `email_send` | ✅ Implemented | `src/lib/verbal-commands/gmail-service.ts` · `src/lib/analytics/providers.ts` · env: `GMAIL_CLIENT_ID/SECRET` |
| **Outlook / Microsoft Mail** | Magic-link quick-open (browser redirect); registered in HandshakeWizard | ✅ UI implemented | `src/components/auth/MagicLinkButtons.tsx` · `src/lib/analytics/providers.ts` · `src/components/HandshakeWizard.tsx` |

---

## 🔐 Auth & Identity

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Supabase** | Core infrastructure — PostgreSQL database, Auth (magic link, OAuth, SSR), Realtime, Storage | ✅ Core / required | `@supabase/supabase-js` · `@supabase/ssr` · `src/lib/supabase/` |
| **SimpleWebAuthn (FIDO2)** | Passkey / biometric authentication — registration + login flows | ✅ Fully implemented | `@simplewebauthn/browser` + `@simplewebauthn/server` · `src/lib/webauthn/` · `src/app/api/auth/webauthn/` |

---

## ☁️ Cloud, Deployment & Hosting

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Vercel** | Primary deployment + Analytics + Speed Insights SDKs + OAuth (admin connections) | ✅ Core / required | `@vercel/analytics` · `@vercel/speed-insights` · `vercel.json` · `src/app/api/admin/connections/vercel/` |
| **GitHub** | OAuth Connect + REST API (`@octokit/rest`) — PR triage, repo listing, audit | ✅ Fully implemented | `@octokit/rest` · `src/app/api/admin/connections/github/` · env: `GITHUB_CLIENT_ID/SECRET` |
| **Railway** | Background service deployment — Social Army Worker runs here via Docker | ✅ Deployed | `railway.json` · `social-army/Dockerfile` |

---

## 🗄️ Infrastructure

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Redis** (ioredis) | Rate limiting, spending caps, session state | ✅ Implemented | `ioredis` npm · `src/lib/rate-limit.ts` · `src/lib/engine/session-redis.ts` |
| **Docker** (dockerode) | Isolated sandbox execution for Emergent engine workspaces | ✅ Implemented | `dockerode` npm · `src/lib/emergent/runner/docker-manager.ts` |
| **Puppeteer / Chromium** | Browser automation engine driving WhatsApp, Discord, Slack, Uber, Maps, Twitter, LinkedIn, Instagram, Facebook, Social Army | ✅ Core engine | `puppeteer` npm · `src/lib/browser/browser-service.ts` · `src/lib/browser/BrowserPool.ts` · `social-army/` |

> **Google STUN servers** (`stun.l.google.com:19302`, `stun1.l.google.com:19302`) are used for WebRTC peer connection negotiation in CQ-to-CQ audio/video calls (`src/lib/cq-to-cq/webrtc-calls.ts`).

---

## 🏠 Smart Home

All seven integrations are registered in the Notification Integration Registry (`src/lib/notifications/integration-registry.ts`). The Philips Hue card is also rendered in `src/components/notifications/BrandedActionCard.tsx`.

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Philips Hue** | Smart light control — on/off, brightness, colour | ✅ Registry + UI card | `src/lib/notifications/integration-registry.ts` · `src/components/notifications/BrandedActionCard.tsx` |
| **Nest** | Thermostat + camera control | ✅ Registry | `src/lib/notifications/integration-registry.ts` |
| **Ring** | Doorbell + security camera | ✅ Registry | `src/lib/notifications/integration-registry.ts` |
| **August Lock** | Smart lock — lock/unlock/status | ✅ Registry | `src/lib/notifications/integration-registry.ts` |
| **Sonos** | Speaker — play, pause, volume, next track | ✅ Registry | `src/lib/notifications/integration-registry.ts` |
| **Ecobee** | Smart thermostat — temperature, mode | ✅ Registry | `src/lib/notifications/integration-registry.ts` |
| **Home Assistant** | Universal gateway for 2,000+ devices | ✅ Registry | `src/lib/notifications/integration-registry.ts` |

---

## 📈 CRM, Marketing & Growth

All entries below are registered in `src/data/saas-integrations.ts` (the SaaS integration ecosystem catalogue shown on the platform). Business Suite entries additionally have live class implementations.

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **HubSpot** | CRM webhook handler (`handleHubSpotEvent`) + integration agent monetization context | ✅ Webhook + agent | `src/lib/emergent/integrations/webhook-bridge.ts` · `src/lib/emergent/subagents/integration-agent.ts` |
| **Salesforce** | CRM webhook handler (`handleSalesforceEvent`) + integration agent monetization context | ✅ Webhook + agent | `src/lib/emergent/integrations/webhook-bridge.ts` · `src/lib/emergent/subagents/integration-agent.ts` |
| **Klaviyo** | Email automation — customer segmentation, VIP flows, revenue attribution (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Gorgias** | AI customer support — auto-resolve tickets (Business Suite) | ✅ Business Suite | `src/lib/emergent/integrations/business-suite.ts` |
| **Mailchimp** | Email & SMS marketing | 📋 SaaS catalogue | `src/data/saas-integrations.ts` |
| **Twilio** | SMS / voice messaging | 📋 SaaS catalogue | `src/data/saas-integrations.ts` |
| **SendGrid** | Transactional email (alternative to Resend) | 📋 SaaS catalogue · mentioned in executor | `src/data/saas-integrations.ts` · `src/lib/self-heal/executor.ts` |
| **Google Ads** | Ad performance tracking | 📋 SaaS catalogue | `src/data/saas-integrations.ts` |
| **LinkedIn Ads** | B2B ad channel | 📋 SaaS catalogue | `src/data/saas-integrations.ts` |

---

## 🔍 Search

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **Brave Search** | REST API — web search for agent tools (`web_search`); also used by orchestrator for current-affairs queries | ✅ Fully implemented | `src/lib/engine/web-tools.ts` · `src/lib/emergent/orchestrator.ts` · env: `BRAVE_API_KEY` |

---

## 🎨 Media Generation

| App | Integration Type | Implementation Status | Source |
|-----|------------------|-----------------------|--------|
| **OpenAI DALL-E 3** | REST API — image generation with rate-limiting and spending cap | ✅ Fully implemented | `src/app/api/generate/image/route.ts` · `src/lib/emergent/subagents/image-agent.ts` |
| **Runway Gen-3** | Video generation (Media Agent placeholder; API integration planned) | 📋 Hooked, not live | `src/lib/emergent/subagents/media-agent.ts` · `src/app/api/generate/video/route.ts` |
| **Luma AI** | Video generation (Media Agent placeholder; named alongside Runway) | 📋 Hooked, not live | `src/lib/emergent/subagents/media-agent.ts` |

---

## 🛠️ Developer Tooling (Runtime)

| Tool | Purpose | Status | Source |
|------|---------|--------|--------|
| **Monaco Editor** | In-app code editor (Dev Console, Studio, LiveCoderPane) | ✅ Embedded | `@monaco-editor/react` · `monaco-editor` npm |
| **xterm.js** | In-app terminal emulator (Studio, Dev Console) | ✅ Embedded | `@xterm/xterm` · `@xterm/addon-fit` npm |
| **Storybook** | Component visual testing & documentation | ✅ Configured | `.storybook/` |
| **Chromatic** | Visual regression testing for Storybook stories | ✅ Configured | `CHROMATIC_TOKEN_STATUS.md` · `verify-chromatic.sh` |

---

## Environment Variables Reference

| Variable | App |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `ELEVENLABS_API_KEY` | ElevenLabs |
| `RESEND_API_KEY` | Resend |
| `BRAVE_API_KEY` | Brave Search |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `NEXT_PUBLIC_VERCEL_CLIENT_ID` + `VERCEL_CLIENT_SECRET` | Vercel OAuth |
| `GMAIL_CLIENT_ID` + `GMAIL_CLIENT_SECRET` | Gmail OAuth |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | Shopify OAuth |
| `PRINTIFY_CLIENT_ID` + `PRINTIFY_CLIENT_SECRET` | Printify OAuth |
| `PRINTFUL_CLIENT_ID` + `PRINTFUL_CLIENT_SECRET` | Printful OAuth |
| `STRIPE_CLIENT_ID` + `STRIPE_CLIENT_SECRET` | Stripe OAuth |
| `UBER_CLIENT_ID` + `UBER_CLIENT_SECRET` | Uber OAuth |
| `ENCRYPTION_KEY` / `OAUTH_ENCRYPTION_KEY` | OAuth token encryption at rest |
| `CRON_SECRET` | Cron job protection (self-heal, RGY discovery) |

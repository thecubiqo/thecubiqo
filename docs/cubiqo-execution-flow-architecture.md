# CubiQo Execution Flow Architecture

Living spec for what happens, when it happens, which layers fire, and which data stores or APIs are touched.

This document complements [cubiqo-living-agentic-architecture.html](./cubiqo-living-agentic-architecture.html). The HTML is the visual board. This file is the engineering truth table.

Last updated: 2026-05-12
Branch observed: `goodfeatureslegacy`

---

## Business Context

CubiQo is not primarily a jobs app, Shopify app, social scheduler, or RGY widget.

CubiQo is a memory-first agentic companion that:

1. Perceives the user through text, voice, image, browser, and later camera/screen.
2. Understands whether the moment is casual conversation, memory, safety, goal formation, or actionable work.
3. Learns the user over time through memory, journal, outcomes, corrections, and recurring patterns.
4. Becomes agentic only when a goal is detected or confirmed.
5. Chooses the safest route for the goal: API, connector, browser, extension, DB, code env, sandbox, or manual handoff.
6. Stops at the user’s final CTA for submit/publish/send/push unless there is an explicit scoped sandbox/POC override.

Hard business guardrails:

- CubiQo never touches payments/billing/checkout.
- CubiQo never autonomously final-submits, publishes, sends, pushes, deploys, or applies. It prepares, previews, explains, and the user presses the final CTA.

---

## Canonical Pipeline

```text
INPUT
  voice / text / image / camera / browser / uploaded file
  ↓
PERCEPTION LAYER
  convert input to normalized payload
  ↓
CONTEXT LAYER
  assemble who / when / where / language / memory / journal / world state
  ↓
UNDERSTANDING + SAFETY CLASSIFICATION
  safety first, then chat/memory/goal/RGY/capability classification
  ↓
SIGNAL + MEMORY ENGINE
  anonymous local memory or signed-in Supabase memory
  ↓
LLM ORCHESTRATOR
  model routing, tools, context bundle, streaming response
  ↓
OPTIONAL POST-PROCESSORS
  recommendation cards, affiliate enrichment, output safety, saved artifacts
  ↓
VOICE OUTPUT
  TTS only when appropriate and allowed by browser autoplay/user preference
```

Important correction:

RGY is not the universal Layer 2. The universal layer is **Understanding + Classification**. RGY is one classifier inside it when activity signals are relevant.

---

## Layer 1 - Perception

Target input types:

| Input | Target handling | Current repo status |
| --- | --- | --- |
| Text | Direct string | Built |
| Voice | Browser SpeechRecognition, optional Whisper fallback | Frontend SpeechRecognition exists; unified server pipeline missing |
| Image upload/paste | Vision model to text description | Upload route exists; image-to-vision perception route missing |
| Browser page | Browserbase/Stagehand screenshot/accessibility tree | Browser runtime exists for agent sessions; “user shows me their screen” input is not unified |
| Camera frame | getUserMedia + frame capture + vision route | Not built |

Target normalized payload:

```ts
type NormalizedInput = {
  content: string;
  modality: 'text' | 'voice' | 'image' | 'browser' | 'camera';
  language?: string;
  source?: string;
  attachments?: Array<{ type: string; url?: string; storagePath?: string }>;
};
```

Missing work:

- `/api/perception/vision`
- `/api/perception/voice` if server-side Whisper fallback is needed
- camera frame capture and permission state
- browser/screen input path distinct from agent-owned Browserbase sessions

---

## Layer 2 - Context

Context bundle should be assembled before the LLM call.

Signed-in context sources:

| Context | Store | Status |
| --- | --- | --- |
| Auth/user id | Supabase Auth | Built |
| Basic profile | `profiles` | Built, but profile columns are minimal |
| Timezone/location/language | `profiles` target columns | Missing/partial |
| Journal | `journal_entries` | Built |
| Recent signals | `signals` | Built |
| Conversation history | `conversation_sessions`, `session_messages`, `conversation_events` | Built/partial |
| Memory events | `memory_events` | Missing table; referenced in background code |
| AI-maintained profile | `user_ai_profile` | Missing table |
| Daily context/news | `profiles.daily_context` target | Missing column/cron in durable form |
| Ready briefings | `capsule_briefings` | Migration exists in proactive work; apply state must be verified |

Target context bundle:

```text
Time: Tuesday, local user time, daypart
Location: city/country if known
Language: user preference and current input language
User AI profile: CubiQo's inferred understanding
Recent memory events: relevant by keyword/weight/recency
Journal summary: recent high-signal reflections
Active goals/signals: recent green or confirmed goals
Ready briefings: research completed while user was away
Current input: normalized content and modality
```

---

## Layer 3 - Safety and Classification

Order:

1. Crisis safety check
2. Hard-block safety check
3. Age-gate/sensitive check
4. Conversation vs memory vs possible goal vs confirmed goal
5. RGY capsule only when useful
6. Route/capability classification only when work is needed

Repo reality:

- `src/lib/rgy/classifier.ts` imports `safety-pattern-cache`.
- `classifyRgyActivity(input, supabase)` is called from `/api/rgy/classify`.
- `safety_patterns` table migration exists.

Correction to older note:

Safety pattern cache is wired. Remaining work is verification, admin UI, and broader classification outside RGY.

---

## Layer 4 - Signal and Memory

### Anonymous Memory

Target:

```json
{
  "session_id": "uuid",
  "first_seen_at": "ISO",
  "last_seen_at": "ISO",
  "visit_count": 1,
  "signals": [],
  "last_summary": null,
  "voice_preference": "text",
  "language_preference": "en"
}
```

Rules:

- localStorage only
- no server write
- max 5 lightweight signals
- 72-hour TTL
- conversion prompt when user has invested enough context
- on signup, migrate local signals/summary into Supabase

Status:

- concept not fully implemented as an architecture layer
- local/session behavior exists in pieces, not this formal contract

### Signed-In Memory

Existing:

- `profiles`
- `signals`
- `journal_entries`
- `conversation_events`
- `conversation_sessions`
- `session_messages`

Missing:

- `memory_events`
- `user_ai_profile`
- session boundary detector
- journal-to-memory extraction
- memory compression
- relevance ranking by keywords
- strategic forgetting/archive
- anonymous-to-signed-in migration

Target `memory_events` fields:

```sql
id uuid primary key
user_id uuid not null references auth.users(id)
event_type text not null
summary text not null
signal_ids uuid[]
keywords text[] default '{}'
weight int default 1
expires_at timestamptz
archived_at timestamptz
created_at timestamptz default now()
```

Target `user_ai_profile`:

```sql
user_id uuid primary key references auth.users(id)
personality_read text
primary_drive text
communication_style text
current_phase text
working_patterns text
what_motivates text
what_blocks text
open_loops text[]
confidence jsonb default '{}'
session_count int default 0
last_updated timestamptz default now()
```

Memory quality rules:

- Keep exact user-stated facts separate from AI inferences.
- Store confidence/source for inferred traits.
- Do not over-compress commitments, blockers, or pivotal episodes.
- Relevance should rank by keyword overlap, weight, and recency.
- Archive stale memory; do not delete unless user asks or retention policy requires.

---

## Layer 5 - LLM Orchestrator

Repo reality:

- Streaming agent route: `src/app/api/agent/stream/route.ts`
- LLM config helper: `src/lib/config/llm.ts`
- Prompt loader exists: `src/lib/ai/prompt-loader.ts`
- `system_prompts` table exists in proactive/config migrations, but seeded placeholder content may still need replacement in the live DB.

Model roles currently defined:

| Role | Default | Override |
| --- | --- | --- |
| agent | `gpt-4.1-mini` | `OPENAI_MODEL`, `AGENT_MODEL` |
| chat | `openai/gpt-5.4` | `CHAT_MODEL`, `OPENAI_MODEL`, `AI_GATEWAY_MODEL` |
| utility | `gpt-4o-mini` | `UTILITY_MODEL` |
| stagehand | `openai/gpt-4.1-mini` | `STAGEHAND_MODEL_NAME`, `STAGEHAND_MODEL`, `OPENAI_MODEL` |
| scoring | `gpt-4o-mini` | `JOB_SCORING_MODEL`, `UTILITY_MODEL` |
| tailoring | `gpt-4o-mini` | `TAILORING_MODEL`, `OPENAI_MODEL` |
| rgy | `gpt-5.4` | `RGY_MODEL`, `OPENAI_MODEL`, `AI_MODEL` |

Important streaming correction:

If affiliate/recommendation enrichment happens after the LLM response, true token streaming and full response rewriting conflict.

Better implementation:

- Stream text normally.
- Extract recommendation candidates from either:
  - tool-call structured output during generation, or
  - a post-response pass after the streamed text completes.
- Render recommendation cards as structured attachments below the message.
- Do not silently rewrite streamed text after the user has already seen it.

---

## Layer 6 - Voice Output

Target:

- Text response to ElevenLabs TTS when user prefers voice or input modality was voice.
- Short responses only by default.
- Long responses stay text-first.
- Greeting voice must respect browser autoplay limits.

Current status:

- TTS route exists.
- ElevenLabs env/config is partially documented.
- Greeting endpoint is missing.
- Browser autoplay will block audio before user interaction on many browsers.

Required behavior:

- If autoplay fails, show a play button instead of failing silently.
- Store `profiles.voice_preference`.
- Use multilingual model for language matching.

---

## Events

### Event 1 - Anonymous First Visit

Trigger:

- App loads.
- No auth token.
- No `cubiqo_session` in localStorage.

Expected sync work:

- Generate session id.
- Store anonymous session object locally.
- No DB read/write.
- No API call.

User sees:

- Neutral greeting.
- No memory reference.

### Event 2 - Anonymous User Speaks

Expected sync work:

- Normalize input.
- Read local session.
- Safety/classification.
- Write local lightweight signal.
- Build anonymous context bundle.
- Stream LLM response.

Optional APIs:

- Whisper fallback for voice.
- Vision for image.
- OpenAI/AI SDK for response.
- Web search only if configured and allowed.

No Supabase user-owned writes.

### Event 3 - Anonymous Returns Within 72 Hours

Expected:

- Read local session.
- Compute time away.
- Use last topic in greeting if appropriate.
- Update visit count and last seen locally.
- Still no private connector access.

### Event 4 - Anonymous Session Expires

Expected:

- If local session is older than TTL, clear it.
- Treat as first visit.

### Event 5 - Anonymous Conversion Trigger

Trigger examples:

- 2+ meaningful green/goal signals.
- 3-5 substantive exchanges.
- explicit commitment.
- returning visit with saved local context.

Expected prompt style:

> “I can remember this for the next two days. Want me to keep it longer?”

Notes:

- Make it friendly and consent-based, not manipulative.
- Loss-aversion should be used carefully and transparently.

### Event 6 - Signup Migration

Target writes:

- local signals to `signals`
- local summary to `memory_events`
- basic preferences to `profiles`
- initial inferred profile to `user_ai_profile` only when enough evidence exists

Missing:

- formal migration function
- local memory contract
- `memory_events` and `user_ai_profile` tables

### Event 7 - Signed-In User Opens App

Target reads:

- `profiles`
- `memory_events`
- `signals`
- `capsule_briefings`
- recent journal/context summary

Target writes:

- `profiles.last_seen_at`
- `profiles.visit_count`
- optional active device id

Target APIs:

- greeting LLM
- ElevenLabs only if allowed/preferred and browser can play audio

Missing:

- `/api/agent/greet`
- expanded profile columns
- audio autoplay fallback

### Event 8 - Signed-In User Speaks

Target:

- perception
- full context assembly
- safety/classification
- write signal or memory as needed
- stream response
- optionally fire background work after response

Important:

Background agent should not run for every chat. It should run only when there is a meaningful goal/signal or scheduled trigger.

### Event 9 - Background Agent

Target:

- insert/update `capsule_briefings`
- read memory/signals
- run search/reconnaissance
- optionally use Browserbase within limits
- synthesize briefing
- push notification if useful and allowed
- write failures to retry queue

Repo status:

- background route exists in proactive work.
- references `memory_events`, which is missing.
- proactive migration includes some supporting tables, but live DB application must be verified.

### Event 10 - Duo Mode Opens

Target:

- load briefing by signal/goal.
- render blockers, questions, approvals, notes, next steps.
- if no briefing exists, Duo Mode still opens with dynamic workbench and asks/works from context.

### Event 11 - Session Ends

Target:

- 30-minute inactivity boundary.
- summarize session.
- extract commitments, blockers, outcomes, episodes.
- write `memory_events`.
- periodically update `user_ai_profile`.

Missing:

- session boundary detector.
- memory compressor.
- user profile rewrite loop.

### Event 12 - Interventions

Target:

- Scheduled engine checks commitments, stale goals, open loops, market watch, and inactivity.
- Sends in-app/push prompts only when useful, rate-limited, and non-annoying.

Missing:

- `interventions_log`
- intervention route if not using current proactive cron routes
- anti-repeat logic

### Event 13 - Daily Digest

Target:

- build user-relevant world context before the user asks.
- write compact summary to profile/daily context.

Caution:

- Better design is per-user local morning, not a single UTC 7am for everyone.

### Event 14 - Briefing Refresh / Market Watch

Target:

- Refresh stale briefings.
- Run market watch subscriptions.
- Notify only on material/time-sensitive changes.

---

## Recommendation and Affiliate Layer

Business idea:

CubiQo recommends tools/products/services naturally as part of helping the user. The system can attach structured recommendation cards and tracked links when a relevant partner/network exists.

Recommended architecture:

1. LLM recommends what is best for the user.
2. Recommendation extractor identifies candidate tools/products/services.
3. Enrichment layer checks:
   - Tier 1 direct affiliate links
   - Tier 2 Skimlinks or equivalent
   - Tier 3 Amazon PA API for physical products/books
4. UI renders recommendation cards below the message.
5. Click endpoint tracks first-party redirect.
6. User can save, dismiss, say “I already have this,” or ask for alternatives.

Critical product rule:

Recommendation quality comes first. Monetization must never override the best answer.

Disclosure:

- Show “CubiQo may earn a commission” on cards.
- Track only with consent where required.
- No third-party tracking pixels.

Target tables:

- `affiliate_links`
- `recommendation_events`
- `affiliate_clicks`
- `saved_recommendations`

Streaming note:

Cards should be attachments, not silent text rewrites after streaming.

---

## Multilingual Layer

Target:

- `profiles.language_preference`
- `profiles.script_preference`
- anonymous local language preference
- STT language parameter
- prompt instruction: match user’s language/code-switching
- ElevenLabs multilingual model

Good design:

- Detect from browser language and actual input.
- Let user override.
- Match Hinglish/Spanglish/code-switching naturally.

---

## Visual Understanding

Target visual modes:

1. Static image upload/paste.
2. Camera frame with explicit permission.
3. Browser/session screenshot and accessibility tree.
4. Later: screen share if browser supports and user approves.

All produce normalized text/context that enters the same pipeline.

Missing:

- `/api/perception/vision`
- camera permission state in profile
- frontend camera capture path

---

## Missing Tables and Columns

### Existing, confirmed in migrations

- `profiles`
- `conversation_events`
- `journal_entries`
- `signals`
- `action_approvals`
- `action_audit_logs`
- `browser_sessions`
- `job_profiles`
- `resume_versions`
- `job_listings`
- `job_applications`
- `social_posts`
- `social_accounts`
- `shopify_store_connections`
- `pod_providers`
- `push_subscriptions`
- `push_notifications`
- `google_oauth_tokens`
- `safety_patterns`
- `system_prompts`
- `capability_overrides`
- `platform_settings`

### Missing or not safely established

- `memory_events`
- `user_ai_profile`
- `interventions_log`
- `affiliate_links`
- `recommendation_events`
- `affiliate_clicks`
- `saved_recommendations`
- `user_api_usage`
- `output_safety_log`

### Profile columns to add

- `display_name`
- `voice_preference`
- `timezone`
- `city`
- `country`
- `location_permission`
- `last_seen_at`
- `visit_count`
- `primary_goal`
- `goal_domain`
- `onboarding_done`
- `onboarding_summary`
- `daily_context`
- `language_preference`
- `script_preference`
- `camera_permission`
- `subscription_tier`
- `referral_code`
- `referred_by`
- `active_device_id`

---

## Proposed Migration Scope

Do not mix this into unrelated proactive work. Create a clean migration:

`supabase/migrations/20260512_memory_revenue_perception_architecture.sql`

It should include:

- profile columns
- `memory_events`
- `user_ai_profile`
- `interventions_log`
- affiliate tables
- usage/rate limit table
- output safety log
- journal `memory_extracted`

RLS:

- users can read their own rows
- server writes for memory/profile inference where appropriate
- no anonymous DB writes for user-owned state

---

## Hardcoded or Config-Driven Concerns

Keep hardcoded:

- no payments
- no autonomous final CTA
- hard safety blocks
- status enums
- RGY colors

Move to config/DB:

- prompt content
- model roles
- runtime numeric limits
- affiliate partners
- conversion nudge thresholds
- memory TTLs/compression thresholds
- per-user language/voice preferences
- provider/account connection state
- daily digest schedule by timezone
- intervention frequency limits

---

## Implementation Order

1. Create memory/profile migration.
2. Seed real `system_prompts` content.
3. Build anonymous local session helper.
4. Build signup migration from local session to Supabase.
5. Build `/api/agent/greet`.
6. Add context bundle builder for signed-in users.
7. Wire journal-to-memory extraction.
8. Build session boundary and memory compression.
9. Build user_ai_profile update loop.
10. Add perception vision route and image/camera frontend path.
11. Add multilingual preference columns and prompt/STT wiring.
12. Build recommendation/affiliate tables and card attachment pattern.
13. Add output safety filter.
14. Add usage/rate limiting.
15. Add intervention/digest/market-watch after the memory foundation is stable.

---

## Verification Checklist

Core:

- Anonymous first visit creates local session only.
- Anonymous second visit within TTL references prior topic.
- Anonymous TTL expiry clears memory.
- Anonymous-to-signup migration preserves signals and summary.
- Signed-in greeting references real user memory.
- Journal entry creates extractable memory.
- Session inactivity writes memory event.
- 50+ routine memories compress without touching commitments/outcomes/episodes.
- User AI profile updates after configured session count.

Language/voice:

- Hindi/Hinglish input produces matching response.
- Voice input uses language preference.
- TTS respects browser autoplay restrictions.
- Long response stays text-first.

Visual:

- Image upload becomes normalized visual description.
- Camera frame requires explicit permission.
- Browser screenshot/AX tree becomes context only with approval.

Guardrails:

- Payment path blocked.
- Final submit/publish/send/push/deploy requires user CTA.
- Output safety filter catches unsafe generated output.
- Anonymous user cannot write user-owned DB rows.

Recommendation:

- Shopify/Fiverr/etc. direct partner renders recommendation card.
- Amazon product mention renders product card where API configured.
- Skimlinks URL enrichment falls back safely if not configured.
- Affiliate redirect writes click record and redirects.
- Declining tracking consent still lets user open recommendation without conversion tracking.

Ops:

- Rate limit blocks overuse gracefully.
- OpenAI outage degrades gracefully.
- Supabase outage shows useful error state.
- Cron logs are inspectable.
- User export/delete endpoints satisfy GDPR requirements.


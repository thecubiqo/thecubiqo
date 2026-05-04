# CubiQo QA Architecture

Date: 2026-05-04

## Current QA State

```mermaid
flowchart TD
  User["User on desktop/mobile browser"] --> QA["QA frontend\nReact app"]
  QA --> Converse["/api/converse\nVercel function"]
  Converse --> RGY["RGY classifier\nUI color + keyword signal"]
  Converse --> OpenAI["OpenAI model\nconversation response"]
  Converse --> ElevenLabs["ElevenLabs TTS\nspeech output"]
  Converse --> Supabase["Supabase\nprofiles, keywords, events"]
  QA --> AudioUI["Listening / Thinking / Speaking / Idle\nvisual + audio state"]

  Browser["Headless browser"] -. "not connected in current QA" .-> Converse
  Extension["Chrome extension"] -. "legacy only, not connected" .-> QA
  SidePanel["Premium Side Panel"] -. "legacy only, not ported" .-> QA
  SettingsCube["SettingsCube"] -. "legacy only, not ported" .-> QA
```

Current meaning:
- QA can converse through the Vercel API.
- QA can use OpenAI and ElevenLabs.
- QA can classify RGY and track keywords.
- QA has Supabase auth/database provisioning work.
- QA does not yet have production browser control, CQ-to-CQ, the legacy Side Panel, SettingsCube, or the full agentic tool loop.

## Future Flagship State

```mermaid
flowchart TD
  User["User\nspeech or Vocspad"] --> Shell["CubiQo Flagship UI\nCuboid + Vocspad"]
  Shell --> State["State machine\nListening -> Thinking -> Speaking -> Idle"]
  Shell --> SidePanel["Side Panel\nRGY keywords, CQ, context"]
  Shell --> SettingsCube["SettingsCube\nvoice/admin config"]

  Shell --> Gateway["CubiQo Gateway\n/api/converse or agent endpoint"]
  Gateway --> Guardrails["Guardrails\nage gate, self-harm handling, consent"]
  Gateway --> RGY["RGY layer\nintent + keyword hints\nUI signal only"]
  Gateway --> AgentRunner["Agent runner\nOpenAI Agents SDK or Vercel AI SDK"]

  AgentRunner --> ModelRouter["Model router\nGPT / Claude / local\nSLA + failover"]
  AgentRunner --> Tools["Tool registry"]
  Tools --> SelfInspect["self_inspect\nruntime/code awareness"]
  Tools --> WebSearch["web_search\nBrave or provider search"]
  Tools --> WebFetch["web_fetch\nclean page read"]
  Tools --> BrowserSession["browser_session\nBrowserbase/Playwright/Stagehand"]
  Tools --> Connectors["connectors\nemail, calendar, taxi, food, smart home"]
  Tools --> CqMessaging["CQ-to-CQ\nidentity, friends, messages"]
  Tools --> Payments["wallet/crypto\nQR delayed release"]
  Tools --> Ops["ops/self-heal\nstatus, reports, NOC"]

  Gateway --> Supabase["Supabase\nauth, profiles, events, keyword sessions"]
  BrowserSession --> BrowserConsent["Approval gates\nclick/type/submit/payment"]
  CqMessaging --> Supabase
  Ops --> Supabase
  Gateway --> TTS["ElevenLabs TTS\nvoice by RGY UI mode"]
  TTS --> Shell
```

Future meaning:
- CubiQo becomes agentic when the LLM can use tools in a controlled loop.
- RGY stays a product/UI/voice signal, not a model selector.
- Browser search and browser control are separate capabilities.
- CQ identity, Side Panel, SettingsCube, RGY, voice, consent, and governance remain CubiQo-owned product logic.

## Browser vs Search

Brave API or another search API:
- Finds web results.
- Returns links/snippets or fetched text.
- Does not click buttons, fill forms, log into sites, or complete workflows by itself.

Headless/browser automation:
- Opens a real browser session.
- Navigates pages.
- Clicks, types, screenshots, extracts, downloads, and observes page state.
- Can execute tasks like booking tickets only with explicit approval gates.

The right future design uses both:
- `web_search` for information lookup.
- `browser_session` for actions on websites.

## Is Browser Control Part Of Agentic?

Yes, but it is one tool inside agentic behavior, not the whole definition.

Agentic CubiQo means:
- It understands a goal.
- It decides whether tools are needed.
- It calls tools safely.
- It observes results.
- It continues or stops based on progress.
- It reports what it did.

Browser control is one powerful tool in that loop.

## Can CubiQo Code Like Codex?

Possible, but only as a gated mode.

Requirements:
- dedicated sandbox/workspace execution
- file read/write permissions
- test runner
- patch review
- Git branch/PR flow
- owner/founder approval
- clear separation from normal public chat

Legacy had self-coding concepts and terminal/workspace APIs, but the current QA app should not expose Codex-like code execution until sandboxing and governance are built.

## Recommended Near-Term Build

1. Add `self_inspect` and `runtime_status` tools.
2. Add an agent runner around `/api/converse`.
3. Add read-only `web_search` and `web_fetch`.
4. Add Side Panel shell and RGY keyword bands.
5. Add hosted browser sessions with explicit consent.
6. Port CQ-to-CQ identity and messaging.
7. Add SettingsCube.
8. Add self-reporting/NOC.
9. Add high-risk tools only after approval gates are mature.


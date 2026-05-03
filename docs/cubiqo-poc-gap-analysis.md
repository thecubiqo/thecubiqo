# CubiQo POC Gap Analysis (RGY + Journal + Browser Agent)

## Current State (in repo)
- Conversational surface exists with voice/text input and state machine labels (Listening/Thinking/Speaking/Idle).
- Right panel already stores color-bucketed keywords (`red|yellow|green`).
- No explicit POC contract document mapping the flagship requirements to implemented UI behavior.

## POC Target (this phase)
1. Keep **left panel** focused on Daily Journal and personality signals.
2. Keep **right panel** focused on RGY keyword segregation and operational status.
3. Include a visible **headless browser agent connection status** (POC stub acceptable).
4. Keep routing/color semantics as operational UI signals, not hard model-binding.

## Implemented in this patch
- Left panel now includes:
  - journal stream (recent user entries)
  - personality signal summary
- Right panel now includes:
  - headless browser agent status card (connected/disconnected toggle for POC)
  - existing RGY keyword segregation remains in place
- Message ingestion now derives:
  - quick RGY hint from text
  - verb/activity extraction for keyword shelf
  - personality token extraction for journal profile

## Remaining Gaps to reach stronger POC
- Replace local/stub classification with deterministic policy module and tests.
- Persist journal + keyword telemetry in session store (optional DB).
- Wire real browser-agent heartbeat endpoint instead of UI toggle.
- Add reduced-motion and responsive polish passes for panel UX.
- Add explicit guardrail flows for self-harm and age-gated paths.

# QA Legacy Feature Branch Migration

Date: 2026-05-06
Branch: `QA/lagacy_feature_branch`

## Purpose

Create a safe copy of the current QA branch and upgrade the platform foundation to the recommended stack:

- Next.js App Router
- TypeScript
- Supabase client compatibility
- Vercel Next deployment
- AI SDK tool layer
- Selected legacy feature bridges

## Completed In This Branch

- Replaced root build/runtime with Next.js:
  - `next.config.mjs`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/app/page.tsx`
  - `src/app/journal/page.tsx`
- Added root TypeScript project config:
  - `tsconfig.json`
  - `next-env.d.ts`
- Updated Vercel config from Create React App static output to Next.js.
- Preserved the current QA React experience through a client-only Next shell:
  - `src/components/CubiQoNextShell.tsx`
- Kept existing regression APIs available as Next route handlers:
  - `src/app/api/converse/route.ts`
  - `src/app/api/voice-cue/route.ts`
  - `src/lib/legacy-vercel-adapter.ts`
- Added an AI SDK v6 tool layer:
  - `src/app/api/chat/route.ts`
  - `src/lib/ai/cubiqo-tools.ts`
- Moved required QA public assets into root `public/assets`.
- Updated Supabase client env compatibility for Next:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Legacy Modules Bridged First

- Current QA voice/converse flow
- RGY keyword classification
- Daily Journal route/CTA surface
- Supabase auth/profile/table regression
- Voice cue route

## Legacy Modules Not Yet Ported

These should be ported feature-by-feature, not merged wholesale:

- Full Daily Journal backend/history UI
- My Dashboard
- Job Hunter
- Website launcher/sites
- Ecomm business pack / Launchpad
- Social Army 10/10/10 worker
- CQ-to-CQ messaging
- Browser automation/extension
- Agent engine/coder/self-heal

## Verification

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run verify:cqai` passed.
- Runtime smoke against `next start` passed for `/`, `/app`, `/journal`, and `/api/converse`.

## Known Follow-Up

`npm audit` reports two moderate findings through Next's nested PostCSS dependency. The automated npm fix recommends a breaking downgrade of Next, so it was not applied. Recheck when Next publishes a patched dependency chain.

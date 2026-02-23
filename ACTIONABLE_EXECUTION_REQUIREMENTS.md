# CUBIQO EXECUTION REQUIREMENTS DRAFT
*Format: Priority-ordered, actionable technical specifications.*

---

# Requirement 1: Nuke Hardcoded Fallbacks (PIN Removal)
### Subheading: Core Security Remediation
- **Function/Feature**: The current `/rescue/page.tsx` and legacy `/founderspass/page.tsx` routes contain a hardcoded '2026' PIN. Delete these files.
- **Type of Change**: Frontend Route Deletion / Security
- **Database Requirement**: Ensure `profiles` table has a robust `is_admin` (BOOLEAN) or `role` (TEXT) column. 
- **API Implementation**: Existing admin endpoints (`/api/admin/*`) must drop any PIN validation and exclusively use `supabase.auth.getUser()`, querying the DB role/admin flag before returning data.
- **Deployment Lifecycle**:
  - **Local Test**: Verify 404 on `localhost:3000/rescue`. Ensure `admin` role logs in.
  - **Staging Deploy**: Merge PR to `staging` branch (auto-deploys to Vercel Staging).
  - **Staging Test**: Run Cypress auth bypass tests against Staging URL.
  - **Prod Deploy**: Merge `staging` -> `main` (auto-deploys to Vercel Prod).
  - **Prod Test**: Manually verify `/rescue` 404s on `cubiqo.com/rescue`.

---

# Requirement 2: Onboarding State DB Persistence
### Subheading: Database Integration & User Retention
- **Function/Feature**: Save user preferences from `/onboarding` directly to the DB instead of just `localStorage`.
- **Type of Change**: API Endpoint (POST) / Database Schema Update
- **Database Requirement**: Create a migration to add `onboarding_data` (JSONB) and `onboarding_completed` (BOOLEAN DEFAULT FALSE) columns to the `profiles` table.
- **API Implementation**: Create `POST /api/onboarding`. Accepts JSON payload `{ config }`. Validates the current session via Supabase, then executes a DB update: `supabase.from('profiles').update({ onboarding_data: config, onboarding_completed: true }).eq('id', user.id)`.
- **Deployment Lifecycle**:
  - **Local Test**: Complete onboarding, verify row updates in local Supabase DB.
  - **Staging Deploy**: Run DB migration in Staging. Merge PR to `staging`.
  - **Staging Test**: End-to-end signup flow on Staging, verify preferences stick after cache clear.
  - **Prod Deploy**: Run DB migration in Prod. Merge `staging` -> `main`.
  - **Prod Test**: Live signup on `.com`, verify data persists on browser reload.

---

# Requirement 3: New User Auth Redirect
### Subheading: User Journey / Routing
- **Function/Feature**: Modifies the magic link callback to route brand-new users to `/onboarding` instead of jumping straight to `/chat`.
- **Type of Change**: API Route Logic (`/auth/callback`)
- **Database Requirement**: Query `SELECT onboarding_completed FROM profiles WHERE id = user.id`.
- **API Implementation**: Update `src/app/auth/callback/route.ts`. After `exchangeCodeForSession(code)`, query the user's `onboarding_completed` flag. If false, `return NextResponse.redirect(new URL('/onboarding', request.url))`.
- **Deployment Lifecycle**:
  - **Local Test**: Trigger magic link locally, step through callback, assert redirect location.
  - **Staging Deploy**: Merge PR to `staging`.
  - **Staging Test**: Sign up with fresh alias, click magic link, verify land on `/onboarding`.
  - **Prod Deploy**: Merge `staging` -> `main`.
  - **Prod Test**: Live signup, verify magic link routes correctly avoiding `/chat`.

---

# Requirement 4: Legal Armor & Data Consent
### Subheading: Compliance & UI
- **Function/Feature**: Add a Cookie Banner, static HTML pages for `/terms` and `/privacy`, and a "Delete My Account & All Data" button for GDPR.
- **Type of Change**: Visuals / API (Account Deletion)
- **Database Requirement**: Ensure `conscious_memory_consent` exists in `profiles`. Hard-deletes must cascade effectively across `memories`, `messages`, and `sessions`.
- **API Implementation**: Create `DELETE /api/users/me`. Verifies `getUser()`, then deletes all associated relational rows from Supabase, followed by `supabase.auth.admin.deleteUser(user.id)`. Create `POST /api/users/consent` to toggle cookie acceptance.
- **Deployment Lifecycle**:
  - **Local Test**: Click "Delete Account", verify local Supabase cascades delete.
  - **Staging Deploy**: Merge PR to `staging`.
  - **Staging Test**: Verify UI banner across devices. Run deletion API check.
  - **Prod Deploy**: Merge `staging` -> `main`.
  - **Prod Test**: Cookie banner visible in Prod incognito.

---

# Requirement 5: Stripe Checkout UI
### Subheading: Monetization Integration
- **Function/Feature**: Connect the $9/mo Personal and $29/mo Pro tiers to real Stripe checkout sessions.
- **Type of Change**: Visuals (Pricing Page) / API (Stripe Checkout)
- **Database Requirement**: Webhook updates `profiles.tier_id` and `profiles.stripe_customer_id`.
- **API Implementation**: Create `POST /api/stripe/checkout`. Resolves tier to a `price_id`, calls `stripe.checkout.sessions.create` with `client_reference_id=user.id`, and returns the `checkout_url`. Update `POST /api/webhooks/stripe` to handle `checkout.session.completed` events.
- **Deployment Lifecycle**:
  - **Local Test**: Stripe CLI forwards webhooks to localhost. Test card `4242`.
  - **Staging Deploy**: Configure Staging Stripe Webhook Secret. Merge PR to `staging`.
  - **Staging Test**: Checkout via Staging UI using Stripe Test Mode.
  - **Prod Deploy**: Configure Prod Stripe keys. Merge `staging` -> `main`.
  - **Prod Test**: Real $1 transaction check (refund immediately) to verify production webhooks.

---

# Requirement 6: Persistent Adaptive User Model
### Subheading: Core AI Backend
- **Function/Feature**: Extract the user's AI model session context out of transient server memory and persist it directly in Supabase so edge restarts don't wipe it out.
- **Type of Change**: API Logic / Database Update
- **Database Requirement**: Add `adaptive_model_state` (JSONB) to the `sessions` or `profiles` table.
- **API Implementation**: Update `POST /api/chat`. On initialization, fetch the JSON `adaptive_model_state` from the DB and inject it into the system prompt. Post-generation, asynchronously `PATCH` the newly evaluated state back to the DB without blocking the user response.
- **Deployment Lifecycle**:
  - **Local Test**: Set parameter, restart Next.js dev server, verify AI memory holds.
  - **Staging Deploy**: Run DB migration in Staging. Merge PR to `staging`.
  - **Staging Test**: Long chat session to verify async PATCH latency doesn't impact UI.
  - **Prod Deploy**: Run DB migration in Prod. Merge `staging` -> `main`.
  - **Prod Test**: Live text conversation to insure context tracking.

---

# Requirement 7: Dashboard Journal Count
### Subheading: UI Data Fetching
- **Function/Feature**: Replace the hardcoded `journalEntriesCount: 0` stub with a live count of user journal entries.
- **Type of Change**: Visuals / Database Query
- **Database Requirement**: Execute `COUNT()` on `journal_entries` filtered by user ID.
- **API Implementation**: In the Next.js Server Component `/dashboard/page.tsx`, directly await `supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id)`. Inject this integer into the UI prop.
- **Deployment Lifecycle**:
  - **Local Test**: Write entry, refresh local dashboard prop.
  - **Staging Deploy**: Merge PR to `staging`.
  - **Staging Test**: Check count matches staging DB directly.
  - **Prod Deploy**: Merge `staging` -> `main`.
  - **Prod Test**: Write a live journal entry, verify UI.

---

# Requirement 8: Vercel Splitting & Hard Caps
### Subheading: Infrastructure Setup
- **Function/Feature**: Mechanically enforce a firm $200/mo spend limit preventing API quota exhaustion attacks from malicious agents or looping bugs.
- **Type of Change**: Infrastructure Config / API Logic
- **Database Requirement**: Ensure `usage_tracking` table reliably records token/cash burn per user account.
- **API Implementation**: Update `checkSpendingCap()` middleware helper to query the `usage_tracking` database sum for the current billing cycle. If the threshold is exceeded, the `/api/chat` and `/api/tts` endpoints must instantly return `429 Too Many Requests`.
- **Deployment Lifecycle**:
  - **Local Test**: Manually alter DB to hit cap, verify `429` block in Postman.
  - **Staging Deploy**: Merge PR to `staging`.
  - **Staging Test**: QA hits API limit intentionally, verifies frontend graceful failure.
  - **Prod Deploy**: Configure Vercel Spend Management caps. Merge `staging` -> `main`.
  - **Prod Test**: Real API call to ensure limits logic functions properly on edge.

---

# Requirement 9: Emergent Studio Vercel Deploy
### Subheading: Advanced Features Pipeline
- **Function/Feature**: Execute the TODO in `deploy/route.ts` so app generation actually launches live URLs for users.
- **Type of Change**: API Integration (External Vercel Serverless API)
- **Database Requirement**: Add `vercel_project_id` and `deployment_url` string columns to internal tracking table.
- **API Implementation**: Update `POST /api/emergent/deploy`. Package the generated raw code/assets and `POST` them to `api.vercel.com/v13/deployments`. Parse the returned `{ url }` payload and patch it backward into the Supabase project row.
- **Deployment Lifecycle**:
  - **Local Test**: Trigger Vercel deploy API with test token, verify fake payload.
  - **Staging Deploy**: Add Vercel API token to Staging Env. Merge PR.
  - **Staging Test**: Deploy standard counter app from Studio, verify url generated natively.
  - **Prod Deploy**: Add Prod Vercel API token. Merge `staging` -> `main`.
  - **Prod Test**: Live test the deploy button inside Studio.

---

# Requirement 10: Port BrowserPool to Railway Worker
### Subheading: Background Automation Workflow
- **Function/Feature**: Vercel timeouts kill background Puppeteer bots. Port `BrowserPool.ts` to a permanent Docker container on Railway.
- **Type of Change**: System Architecture / Message Queue API
- **Database Requirement**: Create a `browser_jobs` queue table (status: pending, running, completed).
- **API Implementation**: `POST /api/automation/job` validates intent and inserts a new row into `browser_jobs`, returning `202 Accepted`. The Railway Node.js worker polls this table constantly, executes the Puppeteer script, and updates the row to `completed`. The Next.js frontend listens for this completion via Supabase Realtime WebSockets.
- **Deployment Lifecycle**:
  - **Local Test**: Run Docker locally via docker-compose, queue a job.
  - **Staging Deploy**: Deploy Worker App to Railway (Staging DB). Merge NextJS PR.
  - **Staging Test**: Trigger verbal execution via frontend, watch Railway logs pick it up and complete.
  - **Prod Deploy**: Deploy Worker App to Railway (Prod DB). Merge NextJS PR to `main`.
  - **Prod Test**: End-to-end user flow: Voice -> Vercel -> DB -> Railway -> Action.

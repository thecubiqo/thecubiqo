# 🎖️ Social Army — User Manual

> **Quick Summary**: Social Army is CubiQo's autonomous social media engine. The code lives in the monorepo under `social-army/`, it runs as a sidecar service on **Railway**, and you manage it from the **Admin Dashboard** at `/admin/social-army`.

---

## Table of Contents

1. [What Is Social Army?](#1-what-is-social-army)
2. [Where to Access It in the UI](#2-where-to-access-it-in-the-ui)
3. [How It Works (Architecture)](#3-how-it-works-architecture)
4. [Easiest Steps to Deploy on Railway](#4-easiest-steps-to-deploy-on-railway)
5. [Using the Dashboard](#5-using-the-dashboard)
6. [Running Locally (Development)](#6-running-locally-development)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Verification & Diagnostics](#8-verification--diagnostics)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. What Is Social Army?

Social Army is an **autonomous content generation and posting system** that manages social media accounts across 10 platforms (Twitter/X, LinkedIn, Instagram, TikTok, YouTube, Reddit, Pinterest, Threads, Facebook, Discord).

**Key concepts:**

| Concept | Description |
|---------|-------------|
| **Sidecar service** | Runs independently from the main CubiQo web app — it has its own `social-army/` directory, Dockerfile, and process |
| **Monorepo code** | Source code lives at `social-army/` in this repository |
| **Railway hosting** | Deployed to Railway as a long-running worker (Vercel kills processes after 10s, so it can't run there) |
| **Admin Dashboard** | Campaign management and monitoring happens in the CubiQo web UI at `/admin/social-army` |
| **Supabase bridge** | The dashboard writes campaign/queue data to Supabase; the Railway worker reads and processes it |

---

## 2. Where to Access It in the UI

### Step-by-step

1. **Log in** to CubiQo as an admin user
2. Navigate to the **Admin area** (`/admin`)
3. In the **left sidebar**, scroll down and click **"Social Army"** (Globe icon 🌐)
4. You are now at `/admin/social-army` — the **Social Army Command Center**

### Sidebar location

```
Admin Sidebar
├── Overview
├── Network Ops
├── System Health
├── Events
├── Users
├── Feature Flags
├── Journey
├── Journal
├── Self-Heal
├── Analytics
├── Security
├── 🌐 Social Army    ← HERE
├── Emails
└── Settings
```

### Direct URLs

| Environment | URL |
|-------------|-----|
| Production  | `https://cubiqo.ai/admin/social-army` |
| Staging     | `https://cubiqo-staging.vercel.app/admin/social-army` |

---

## 3. How It Works (Architecture)

```
┌──────────────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   VERCEL (Web App)       │     │   SUPABASE (DB)      │     │  RAILWAY (Worker) │
│                          │     │                      │     │                   │
│  /admin/social-army      │────▶│  social_campaigns    │◀────│  worker.ts        │
│  (Start Campaign)        │     │  content_queue       │     │  (polls every 5s) │
│                          │     │  social_accounts     │     │                   │
└──────────────────────────┘     └──────────────────────┘     └───────────────────┘
         Dashboard                    Shared Database              Content Engine
     (creates campaigns)         (the bridge between them)     (generates & posts)
```

**Flow:**
1. You click **"Start Campaign"** on the dashboard → a campaign row is inserted into `social_campaigns`
2. The Railway worker polls Supabase every 5 seconds, picks up the campaign, and auto-generates content queue items
3. The Content Engine generates captions/images using GFXToolz, Gemini, or OpenAI (with a built-in template fallback)
4. Generated content is marked as `ready`, then auto-posted to social platforms

---

## 4. Easiest Steps to Deploy on Railway

### Prerequisites

- A [Railway](https://railway.app) account (free tier works to start)
- Your Supabase project URL and Service Role Key
- The database migration already applied (see Step 1)

### Step 1 — Set Up the Database

Run the Social Army migration in your Supabase SQL Editor to create the required tables:

```sql
-- File: supabase/migrations/20260217000004_social_army_schema.sql
-- This creates: social_accounts, social_campaigns, content_queue
```

1. Open **Supabase Dashboard** → **SQL Editor**
2. Paste the contents of `supabase/migrations/20260217000004_social_army_schema.sql`
3. Click **Run**

### Step 2 — Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select the `thecubiqo/thecubiqo` repository
4. **Set Root Directory** to `/social-army` (important — Railway needs to know the service lives in a subdirectory)
5. Railway will auto-detect the `Dockerfile` at `social-army/Dockerfile`

### Step 3 — Configure Environment Variables

In Railway's service settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | ✅ Yes |
| `SOCIAL_ARMY_STATUS` | `ON` | ✅ Yes |
| `GFX_TOOLZ_USER` | GFXToolz username (for image/video generation) | Optional |
| `GFX_TOOLZ_PASS` | GFXToolz password | Optional |
| `GEMINI_API_KEY` | Google Gemini API key (text generation fallback) | Optional |
| `OPENAI_API_KEY` | OpenAI API key (text + image generation fallback) | Optional |

> **Note**: At minimum you need the Supabase credentials. The content engine has a built-in template fallback that works without any AI API keys.

### Step 4 — Deploy

1. Click **Deploy** in Railway
2. Railway builds the Docker image (installs Node.js 20 + Chromium)
3. The worker starts with `npx tsx src/worker.ts`
4. You should see logs: `⚔️ Social Army Worker v2 Started`

### Step 5 — Verify

- Check Railway logs for: `Social Army Worker v2 Started`
- Go to the Admin Dashboard at `/admin/social-army` and click **"Start Campaign"**
- Watch the **Live Feed** panel update in real-time as the worker processes queue items

### That's it! 🎉

The worker will now run 24/7 on Railway, polling every 5 seconds for new work.

---

## 5. Using the Dashboard

### Dashboard Layout

The Social Army Command Center (`/admin/social-army`) has four main sections:

#### A. Top Bar — System Status & Campaign Launch

- **System Online** indicator (green dot) — shows the system is connected
- **"Start Campaign" button** — creates a new auto-campaign with a default seed topic

#### B. Active Campaigns

- Shows your most recent campaigns (up to 5)
- Each card displays: campaign name, status (RUNNING / DRAFT / PAUSED), and progress percentage
- Progress is calculated from actual posted items vs. the campaign's target

#### C. Persona Grid (5 Groups)

| Persona | Accounts | Content Style |
|---------|----------|---------------|
| **The Builders** | 20 | Coding tutorials, GitHub commits, architecture diagrams |
| **Productivity Gurus** | 30 | Workflow hacks, time-saving tips, tool comparisons |
| **The Philosophers** | 15 | AI ethics debates, deep threads, thought-provoking content |
| **Visual Artists** | 20 | 3D renders, abstract UI, calm animations |
| **The Memelords** | 15 | High-energy chaos, reaction videos, trending formats |

Each card shows the persona's status (active / warning / offline) and account count.

#### D. Live Feed & Configuration

- **Live Feed** — real-time console showing content queue items as they are generated and posted
- **Configuration panel** — shows total daily posts, content diversity level, and a link to Puppeteer configuration

### Common Actions

| Action | How |
|--------|-----|
| **Start a campaign** | Click the purple **"Start Campaign"** button in the top-right |
| **Monitor progress** | Watch the Active Campaigns cards and Live Feed panel |
| **Check real-time updates** | The dashboard auto-refreshes via Supabase Realtime subscriptions |

---

## 6. Running Locally (Development)

For testing or development, you can run the worker on your machine:

```bash
# 1. Navigate to the social-army directory
cd social-army

# 2. Install dependencies
npm install

# 3. Create your .env file from the example
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start the worker
npm start
```

You should see:
```
⚔️  Social Army Worker v2 Started
   Content Engine: ACTIVE
   Supabase: https://your-project.supabase.co
```

> **Tip**: The worker polls every 5 seconds. Start a campaign from the dashboard and you'll see it processing in your terminal.

---

## 7. Environment Variables Reference

These go in `social-army/.env` for local development, or in Railway's environment settings for production:

```bash
# ── Required ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SOCIAL_ARMY_STATUS=ON

# ── Content Generation (pick at least one) ────
GFX_TOOLZ_USER=your-gfxtoolz-username       # Primary: GFXToolz.ai
GFX_TOOLZ_PASS=your-gfxtoolz-password
GEMINI_API_KEY=your-gemini-key               # Fallback 1: Google Gemini
OPENAI_API_KEY=your-openai-key               # Fallback 2: OpenAI

# ── CubiQo Access (for screen recording) ─────
CUBIQO_URL=https://cubiqo.ai
CUBIQO_ADMIN_USER=admin@cubiqo.ai
CUBIQO_ADMIN_PASS=your-password

# ── Social Platform Credentials ───────────────
TWITTER_USER=your-twitter-handle
TWITTER_PASS=your-twitter-password
TIKTOK_USER=your-tiktok-handle
TIKTOK_PASS=your-tiktok-password
# ... add more platforms as needed
```

**Content generation priority:**
1. **GFXToolz** (primary — uses your subscription for image/video/text)
2. **Gemini API** (fallback for text generation)
3. **OpenAI API** (fallback for text + image generation)
4. **Template engine** (always works, no API keys needed)

---

## 8. Verification & Diagnostics

### Run the Diagnostic Tool

```bash
npx tsx scripts/verify-army.ts
```

This checks:
- ✅ Environment variables are set
- ✅ Supabase connection works
- ✅ Database latency is under 500ms
- ✅ Required tables exist (`social_campaigns`, `content_queue`, `social_accounts`)
- ✅ RLS policies allow worker access

### Check Railway Logs

In Railway dashboard → your service → **Logs** tab. Look for:
```
⚔️  Social Army Worker v2 Started
   Content Engine: ACTIVE
📦 Found X pending items.
🚀 POSTING to TWITTER
   ✅ Posted!
```

### Verify from the Dashboard

1. Go to `/admin/social-army`
2. Click **"Start Campaign"**
3. The Live Feed should show items appearing within 5–10 seconds
4. Campaign progress should start incrementing

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| **Worker won't start** | Check Railway logs. Most common: missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` |
| **"No active tasks in queue"** in dashboard | Click "Start Campaign" to create one, or check that the Railway worker is running |
| **Campaign stuck at 0%** | Verify the worker is running and connected to the same Supabase instance as the dashboard |
| **Content generation fails** | Set at least one AI API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`), or the template engine will be used as fallback |
| **Railway build fails** | Ensure the root directory is set to `/social-army` in Railway settings |
| **Dashboard not updating in real-time** | Check that Supabase Realtime is enabled for the `content_queue` table |
| **Latency > 500ms** | Your Supabase region may be far from Railway's region. Deploy both in the same region (e.g., US East) |

---

## Quick Reference

| What | Where |
|------|-------|
| **Dashboard** | `/admin/social-army` (sidebar → Social Army 🌐) |
| **Worker code** | `social-army/src/worker.ts` |
| **Content engine** | `social-army/src/content-engine.ts` |
| **Platform config** | `social-army/config/platforms.json` |
| **Brand voice config** | `social-army/config/brand-context.json` |
| **Dockerfile** | `social-army/Dockerfile` |
| **Railway config** | `railway.json` (repo root) |
| **DB migration** | `supabase/migrations/20260217000004_social_army_schema.sql` |
| **Diagnostic tool** | `scripts/verify-army.ts` |
| **Architecture doc** | `docs/SOCIAL_ARMY_ARCHITECTURE.md` |
| **Deployment diagram** | `docs/SOCIAL_ARMY_DEPLOYMENT_DIAGRAM.md` |

# ⚔️ Social Army Manual: Deployment & Check Procedures

This document outlines the **Step-by-Step Process** to deploy, verify, and run the Social Army feature across Staging and Production.

---

## 1. Environment Setup (Database)

First, we must ensure the database schema is correct for high-performance operations.

### Staging Environment (`staging0217`)
**Target Project**: `wnnkryfnqatxijpyeqlv` (New Project)
1.  Open `supabase/MASTER_STAGING_SETUP.sql`.
2.  Copy all content.
3.  Go to Supabase Dashboard (Staging) -> SQL Editor.
4.  Paste & Run.
    *   **Result**: Tables created, Policies applied, **Dummy Data Loaded**.

### Production Environment (`main`)
**Target Project**: `lkzmzctdhneaxjilsfua` (Original Project)
1.  Open `supabase/MASTER_PRODUCTION_SETUP.sql`.
2.  Copy all content.
3.  Go to Supabase Dashboard (Production) -> SQL Editor.
4.  Paste & Run.
    *   **Result**: Tables created, Policies applied, **Zero Data** (Clean Slate).

---

## 2. Code Deployment (Frontend)

The Admin Dashboard provides the Control Room for the Army.

1.  **Merge & Push**: Ensure `main` branch is up to date (`git push origin main`).
2.  **Verify Vercel**: Deployment should finish successfully.
3.  **Access Control Room**:
    *   Go to: `https://cubiqo.ai/admin/social-army` (Production)
    *   Go to: `https://cubiqo-staging.vercel.app/admin/social-army` (Staging)

---

## 3. The "Army" (Worker Bot) Setup

The Army is a "Sidecar Service" running independently of the Next.js frontend. It handles automation.

### Option A: Run Locally (Testing / High Speed Dev)
Use your laptop as the server. This is free and fastest for debugging.

1.  **Navigate**: `cd social-army`
2.  **Install dependencies**: `npm install`
3.  **Launch**: `npm start`
    *   **Output**: `🚀 Social Army Worker Started`
    *   **Logs**: You will see `Thinking...`, `Processing...`, `Posted!` in real-time.

### Option B: Deploy to Cloud (Railway / Render)
For 24/7 operation.

1.  **Create Service**: Deploy from GitHub Repo (`thecubiqo`).
2.  **Root Directory**: Set to `/social-army`.
3.  **Environment Variables**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (Your Prod URL)
    *   `SUPABASE_SERVICE_ROLE_KEY`: (Your Prod Service Key)
4.  **Scale**: Set Replica Count to 1 (Start small).

---

## 4. Verification & Diagnostics

We have built a custom diagnostic tool to check for bugs/errors.

**Run Diagnostic**:
```bash
npx tsx scripts/verify-army.ts
```

**Checklist:**
- [ ] **Data Integrity**: Script confirms tables exist.
- [ ] **Latency**: Response time < 500ms (High Performance).
- [ ] **Permissions**: RLS Policies allow worker access.

---

## 5. Performance Tuning

For "High Definition & Reporting":

*   **Reporting**: The Dashboard at `/admin/social-army` shows live feed updates.
*   **Speed**: The worker polls every 5 seconds. To increase throughput:
    1.  Edit `social-army/src/worker.ts`
    2.  Change `setTimeout(..., 5000)` to `2000` (2 seconds).
    3.  Scale up Worker Replicas if queue backlog grows > 100 items.

*   **Definition**: The current worker generates simulated text/image. To enable Real Browser Automation (Headless Chrome):
    1.  Uncomment `puppeteer` imports in `worker.ts`.
    2.  Implement `page.goto('twitter.com')` logic.
    3.  *Warning: High resource usage.*

---

**Status**: Ready for Deployment.

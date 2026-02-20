# CubiQo Release & Deployment Strategy

**Author:** MO (CTO)  
**Version:** 1.0  
**Date:** February 17, 2025  
**Status:** Architecture Decision Record (ADR)

---

## Executive Summary

This document defines the **release process, deployment strategy, and environment management** for CubiQo. Our goal is to enable **continuous feature development** while maintaining a **stable production environment** at cubiqo.ai.

### Key Decisions

1. **Three-Environment Strategy**: Development → Staging → Production
2. **Git Flow Branching**: `main` (dev), `staging` (pre-prod), `production` (live)
3. **Feature Flag Strategy**: Use existing feature flags for gradual rollouts
4. **Supabase Multi-Project**: Separate databases for staging and production
5. **Vercel Multi-Environment**: Automatic deployments per branch
6. **Release Cadence**: Weekly releases to production (Fridays)

---

## Table of Contents

1. [Environment Architecture](#environment-architecture)
2. [Branching Strategy](#branching-strategy)
3. [Deployment Pipeline](#deployment-pipeline)
4. [Database Strategy](#database-strategy)
5. [Feature Development Workflow](#feature-development-workflow)
6. [Release Process](#release-process)
7. [Rollback Strategy](#rollback-strategy)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Team Responsibilities](#team-responsibilities)
10. [Migration Plan](#migration-plan)

---

## 1. Environment Architecture

We will maintain **three isolated environments** for different stages of development:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ENVIRONMENTS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐  │
│  │  DEVELOPMENT     │   │    STAGING      │   │   PRODUCTION    │  │
│  │  (main)          │   │   (staging)     │   │  (production)   │  │
│  ├─────────────────┤   ├─────────────────┤   ├─────────────────┤  │
│  │ localhost:3000   │   │ staging.cubiqo  │   │  cubiqo.ai      │  │
│  │                  │   │   .ai           │   │                 │  │
│  │ Branch: main     │   │ Branch: staging │   │ Branch:         │  │
│  │ Auto-deploy: NO  │   │ Auto-deploy: YES│   │  production     │  │
│  │ CI/CD: YES       │   │ CI/CD: YES      │   │ Auto-deploy: YES│  │
│  │                  │   │                 │   │ CI/CD: YES      │  │
│  │ DB: Dev Supabase │   │ DB: Staging     │   │ DB: Prod        │  │
│  │ Keys: Test/Dev   │   │  Supabase       │   │  Supabase       │  │
│  │ Analytics: OFF   │   │ Keys: Test/Dev  │   │ Keys: Production│  │
│  │ Error Track: OFF │   │ Analytics: YES  │   │ Analytics: YES  │  │
│  │                  │   │ Error Track: YES│   │ Error Track: YES│  │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘  │
│         │                      │                      │             │
│         │                      │                      │             │
│         └──────────────────────┴──────────────────────┘             │
│                                │                                    │
│                                ▼                                    │
│                    ┌──────────────────────┐                         │
│                    │  SHARED SERVICES     │                         │
│                    ├──────────────────────┤                         │
│                    │ • Vercel Hosting     │                         │
│                    │ • GitHub Actions CI  │                         │
│                    │ • ElevenLabs TTS     │                         │
│                    │ • Feature Flags      │                         │
│                    └──────────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Environment Details

| Environment | Purpose | URL | Branch | Auto-Deploy | DB | API Keys |
|------------|---------|-----|--------|-------------|-----|----------|
| **Development** | Local dev, rapid iteration | `localhost:3000` | `main` | No | Dev Supabase | Test/Mock |
| **Staging** | Pre-production testing, QA | `staging.cubiqo.ai` | `staging` | Yes | Staging Supabase | Test/Mock |
| **Production** | Live users | `cubiqo.ai` | `production` | Yes | Prod Supabase | Production |

### Environment Characteristics

#### Development (Local)
- **Purpose**: Active feature development, experimentation
- **Data**: Seeded test data, can be reset
- **Users**: Developers only
- **Stability**: Can break, fast iteration
- **Monitoring**: Console logs only
- **Cost**: Minimal

#### Staging
- **Purpose**: Production-equivalent testing before release
- **Data**: Sanitized production copy or realistic test data
- **Users**: QA team, product owner, select beta testers
- **Stability**: Should be stable, but can tolerate issues
- **Monitoring**: Full analytics, error tracking
- **Cost**: Same as production infrastructure

#### Production
- **Purpose**: Serve real users
- **Data**: Real user data (protected)
- **Users**: Public, paying customers
- **Stability**: **Must be stable** - zero tolerance for breaking changes
- **Monitoring**: Full analytics, error tracking, alerts
- **Cost**: Optimized, monitored

---

## 2. Branching Strategy

We'll use a **Git Flow** variant optimized for continuous deployment:

```
main (development)
  │
  ├── feature/dashboard-ui ──┐
  ├── feature/journal-api ───┼──> PR → main
  ├── fix/auth-bug ──────────┘
  │
  │ (Weekly merge)
  ▼
staging (pre-production)
  │
  │ (Testing period: 2-3 days)
  │ (Bug fixes cherry-picked from main)
  │
  │ (Release approval)
  ▼
production (live)
  │
  │ (Hotfix if needed)
  ├── hotfix/critical-bug ──> PR → production + cherry-pick to main
```

### Branch Definitions

| Branch | Purpose | Deploy To | Merge From | Protected |
|--------|---------|-----------|------------|-----------|
| `main` | Active development | Local only | Feature branches | Yes |
| `staging` | Pre-production testing | staging.cubiqo.ai | main | Yes |
| `production` | Live production | cubiqo.ai | staging | **YES** |
| `feature/*` | Individual features | Local preview | main | No |
| `hotfix/*` | Emergency fixes | production | production | No |

### Branch Rules

#### `main` (Development)
- **Source of truth** for active development
- All feature branches merge here first
- CI/CD runs on every push (lint, test, build)
- **NOT** deployed to any public environment
- Protected: Requires PR approval from CTO (MO)
- Squash merges preferred for clean history

#### `staging` (Pre-Production)
- **Receives merges from `main`** weekly (or as needed)
- Auto-deploys to `staging.cubiqo.ai` via Vercel
- Must pass all CI/CD checks before merge
- Used for QA testing, product owner review
- Bug fixes cherry-picked from `main` during testing window
- Protected: Requires CTO approval + CI passing

#### `production` (Live)
- **Receives merges from `staging`** after approval
- Auto-deploys to `cubiqo.ai` via Vercel
- **Only stable, tested code**
- Hotfixes can go directly here in emergencies
- Protected: Requires CTO approval + CI passing + manual approval
- No force pushes, no direct commits

#### `feature/*` (Feature Branches)
- Short-lived branches for individual features
- Branch from `main`, merge back to `main`
- Naming: `feature/dashboard-ui`, `feature/journal-integration`
- Delete after merge
- Can deploy to Vercel preview URLs for demos

#### `hotfix/*` (Emergency Fixes)
- Branch from `production` for critical bugs
- Merge to `production` immediately after testing
- **Must also be cherry-picked to `main` and `staging`**
- Naming: `hotfix/auth-crash`, `hotfix/payment-failure`

---

## 3. Deployment Pipeline

### Automated Deployment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. COMMIT TO BRANCH                                          │
│     │                                                         │
│     ├─ feature/* ──> Local testing                           │
│     ├─ main ────────> CI/CD (lint, test, build)             │
│     ├─ staging ─────> CI/CD + Auto-deploy to staging        │
│     └─ production ──> CI/CD + Auto-deploy to production     │
│                                                               │
│  2. GITHUB ACTIONS (CI/CD)                                    │
│     │                                                         │
│     ├─ Install dependencies (npm ci)                         │
│     ├─ Run linter (npm run lint)                             │
│     ├─ Run tests (npm run test:run)                          │
│     ├─ Run build (npm run build)                             │
│     ├─ Security scan (CodeQL)                                │
│     └─ If all pass → Proceed                                 │
│        If any fail → Block deployment                        │
│                                                               │
│  3. VERCEL DEPLOYMENT                                         │
│     │                                                         │
│     ├─ Build Next.js app                                     │
│     ├─ Generate static assets                                │
│     ├─ Deploy to edge network                                │
│     ├─ Run smoke tests                                       │
│     └─ Go live (or rollback on failure)                      │
│                                                               │
│  4. POST-DEPLOYMENT                                           │
│     │                                                         │
│     ├─ Warm up serverless functions                          │
│     ├─ Verify health endpoints                               │
│     ├─ Run automated smoke tests                             │
│     ├─ Notify team (Slack/Discord)                           │
│     └─ Monitor error rates                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Vercel Configuration

**Current Setup:**
- `production` branch → `cubiqo.ai` (production deployment)

**Required Setup:**
- `staging` branch → `staging.cubiqo.ai` (new staging deployment)
- `main` branch → **No auto-deploy** (CI only)
- `feature/*` → Preview deployments (optional)

**Vercel Project Settings:**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "environmentVariables": {
    "NEXT_PUBLIC_SUPABASE_URL": "staging-specific",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "staging-specific",
    "NODE_ENV": "production"
  }
}
```

### CI/CD Configuration (GitHub Actions)

**Existing:** `.github/workflows/ci.yml`

**Enhancement Required:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, production]
  pull_request:
    branches: [main, staging, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:run
      - name: Security Scan
        uses: github/codeql-action/analyze@v3

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: echo "Vercel auto-deploys on push to staging"
      - name: Run Smoke Tests
        run: npm run test:visual-smoke -- --env=staging
      - name: Notify Team
        run: |
          echo "✅ Deployed to staging.cubiqo.ai"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/production' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: echo "Vercel auto-deploys on push to production"
      - name: Run Smoke Tests
        run: npm run test:visual-smoke -- --env=production
      - name: Notify Team
        run: |
          echo "🚀 Deployed to cubiqo.ai"
      - name: Monitor Error Rates
        run: npm run monitor:errors -- --duration=5m
```

---

## 4. Database Strategy

### Multi-Project Supabase Setup

We need **two separate Supabase projects**:

| Environment | Supabase Project | Purpose | Data |
|------------|------------------|---------|------|
| **Development** | Dev project (optional) | Local dev, testing | Seeded test data |
| **Staging** | Staging project | Pre-prod testing | Copy of prod (sanitized) |
| **Production** | Production project | Live users | Real user data |

**Note:** Development can share the staging database if needed, but staging and production **must be separate**.

### Migration Strategy

**Approach:** Schema-first migrations with version control

```
supabase/migrations/
  ├── 20260101000000_initial_schema.sql
  ├── 20260115000000_add_feature_flags.sql
  ├── 20260201000000_add_journal_tables.sql
  └── 20260217000000_add_dashboard_tables.sql
```

**Workflow:**

1. **Develop migration locally**
   ```bash
   # Create migration file
   supabase migration new add_journal_tables
   
   # Write SQL
   vim supabase/migrations/20260217000001_add_journal_tables.sql
   
   # Test locally
   supabase db reset
   ```

2. **Apply to staging**
   ```bash
   # Connect to staging project
   supabase link --project-ref staging-project-id
   
   # Apply migration
   supabase db push
   
   # Verify
   supabase db diff
   ```

3. **Apply to production** (after testing)
   ```bash
   # Connect to production project
   supabase link --project-ref prod-project-id
   
   # Apply migration
   supabase db push
   
   # Backup first!
   pg_dump $PROD_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

### Data Seeding

**Development/Staging:**

```sql
-- supabase/seed.sql
INSERT INTO users (id, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@cubiqo.ai', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'demo@cubiqo.ai', 'user');

INSERT INTO feature_flags (name, enabled, scope) VALUES
  ('dashboard_ui', true, 'global'),
  ('journal_feature', false, 'global');
```

**Production:** No seeding (real data only)

---

## 5. Feature Development Workflow

### Standard Feature Development

For upcoming features like **Dashboard** and **Journal**:

```
Day 1: Feature Planning (JO + MO)
  └─> Define requirements, API contracts, database schema

Day 2-5: Development
  ├─> Blossom: Backend API (feature branch)
  ├─> Bubbles: Frontend UI (same feature branch)
  ├─> Guy: Database schema (migration file)
  └─> Pushpa: Design assets (design tokens)

Day 6: Code Review (MO)
  └─> Review PR, request changes, approve

Day 7: Merge to main
  └─> Feature branch → main (squash merge)
  └─> CI/CD runs, tests pass
  └─> Feature available in local dev

Day 8-10: Staging Testing
  └─> Merge main → staging (weekly release)
  └─> Auto-deploy to staging.cubiqo.ai
  └─> QA testing (Buttercup)
  └─> Product review (JO)
  └─> Bug fixes (if needed)

Day 11: Production Release (Friday)
  └─> Merge staging → production
  └─> Auto-deploy to cubiqo.ai
  └─> Monitor metrics
  └─> Celebrate 🎉
```

### Feature Flag Workflow

For features that need **gradual rollout**:

1. **Develop feature behind a flag**
   ```tsx
   import { useFeatureFlag } from '@/hooks/useFeatureFlag';
   
   function DashboardPage() {
     const { enabled } = useFeatureFlag('dashboard_ui');
     
     if (!enabled) {
       return <ComingSoonPage />;
     }
     
     return <DashboardUI />;
   }
   ```

2. **Deploy to production with flag OFF**
   ```sql
   INSERT INTO feature_flags (name, enabled, scope, config)
   VALUES ('dashboard_ui', false, 'global', '{"percentage": 0}');
   ```

3. **Enable for internal users first**
   ```sql
   UPDATE feature_flags
   SET config = '{"user_whitelist": ["mo@cubiqo.ai", "jo@cubiqo.ai"]}'
   WHERE name = 'dashboard_ui';
   ```

4. **Gradual rollout**
   ```sql
   -- 10% of users
   UPDATE feature_flags SET config = '{"percentage": 10}' WHERE name = 'dashboard_ui';
   
   -- 50% of users
   UPDATE feature_flags SET config = '{"percentage": 50}' WHERE name = 'dashboard_ui';
   
   -- 100% of users
   UPDATE feature_flags SET enabled = true, config = '{"percentage": 100}' WHERE name = 'dashboard_ui';
   ```

5. **Remove flag** (after 2 weeks of 100% rollout)
   ```tsx
   // Remove conditional logic
   function DashboardPage() {
     return <DashboardUI />; // Always show
   }
   ```

---

## 6. Release Process

### Weekly Release Cadence

**Schedule:** Every Friday at 2:00 PM UTC

**Why Friday?**
- Team is available for monitoring over the weekend
- Low traffic period (business users off for weekend)
- Allows hotfixes Monday if needed

### Release Checklist

#### **Wednesday: Release Planning**
- [ ] JO reviews staging features
- [ ] MO reviews code quality, technical debt
- [ ] Buttercup confirms all tests pass
- [ ] Team identifies any release blockers
- [ ] Create release branch `release/2025-02-21` from staging
- [ ] Update CHANGELOG.md

#### **Thursday: Final Testing**
- [ ] QA smoke tests on staging
- [ ] Performance benchmarks
- [ ] Security scan (CodeQL)
- [ ] Database migration dry-run
- [ ] Backup production database
- [ ] Notify stakeholders of pending release

#### **Friday: Release Day**
- [ ] 2:00 PM UTC: Merge staging → production
- [ ] Vercel auto-deploys
- [ ] Run automated smoke tests
- [ ] Manual smoke test (load cubiqo.ai)
- [ ] Monitor error rates (15 min)
- [ ] Check analytics dashboard
- [ ] Notify team: ✅ Release successful
- [ ] Update status page
- [ ] Post in company Discord/Slack

#### **Post-Release Monitoring**
- [ ] Monitor error rates (24 hours)
- [ ] Check user feedback channels
- [ ] Review analytics for anomalies
- [ ] Prepare hotfix if critical issues arise

### Hotfix Process (Emergency)

**When to use:** Critical bugs affecting users (auth broken, payments failing, data loss)

**Process:**
1. **Create hotfix branch from production**
   ```bash
   git checkout production
   git pull
   git checkout -b hotfix/auth-crash
   ```

2. **Fix the issue**
   - Write minimal fix
   - Add regression test
   - Test locally

3. **Fast-track review**
   - Create PR to production
   - MO reviews immediately
   - Merge if approved

4. **Deploy**
   - Push to production branch
   - Vercel auto-deploys
   - Monitor closely

5. **Backport to other branches**
   ```bash
   git checkout staging
   git cherry-pick <hotfix-commit-sha>
   
   git checkout main
   git cherry-pick <hotfix-commit-sha>
   ```

---

## 7. Rollback Strategy

### Automatic Rollback (Vercel)

Vercel keeps the last 20 deployments. If a deployment fails health checks, it automatically rolls back.

**Manual Rollback:**
```bash
# Via Vercel CLI
vercel rollback <deployment-url>

# Or via dashboard
# 1. Go to vercel.com/thecubiqo/thecubiqo/deployments
# 2. Find previous working deployment
# 3. Click "Promote to Production"
```

### Database Rollback

**Approach:** Forward-only migrations

- **Never rollback database migrations**
- Instead, write a **new migration** to undo changes
- Keep backups for disaster recovery

**Example:**
```sql
-- Original migration: 20260217000001_add_journal_tables.sql
CREATE TABLE journal_entries (...);

-- Rollback migration: 20260217000002_remove_journal_tables.sql
DROP TABLE journal_entries;
```

### Feature Flag Rollback

**Instant rollback** without redeployment:

```sql
-- Disable feature immediately
UPDATE feature_flags SET enabled = false WHERE name = 'dashboard_ui';
```

This is why feature flags are powerful — you can turn off broken features without redeploying.

---

## 8. Monitoring & Alerts

### What to Monitor

| Metric | Tool | Alert Threshold | Action |
|--------|------|-----------------|--------|
| Error rate | Vercel Analytics | >1% | Investigate immediately |
| Response time | Vercel Analytics | >2s p95 | Check slow queries |
| Deployment success | GitHub Actions | Failed build | Fix and redeploy |
| Database CPU | Supabase Dashboard | >80% | Optimize queries |
| API rate limits | Supabase Dashboard | 90% of quota | Upgrade plan |
| User signups | Custom dashboard | Sudden drop | Check auth flow |
| Voice failures | Custom logging | >5% | Check ElevenLabs API |

### Monitoring Setup

**Vercel Analytics:**
- Already integrated (`@vercel/analytics`)
- Tracks: Page views, response times, errors

**Supabase Monitoring:**
- Built-in dashboard
- Database metrics, API usage, auth stats

**Custom Logging:**
```ts
// lib/monitoring.ts
export function logError(error: Error, context: Record<string, any>) {
  console.error('[ERROR]', error.message, context);
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}
```

### Alerts

**Critical Alerts** (immediate response):
- Production deployment failed
- Error rate >5%
- Database down
- Authentication broken

**Warning Alerts** (investigate within 1 hour):
- Error rate >1%
- Response time >3s
- Database CPU >80%

**Info Alerts** (review daily):
- New user signups
- Feature flag changes
- Deployment completions

---

## 9. Team Responsibilities

### MO (CTO) - Yourself
- **Code Review:** Approve all PRs to main, staging, production
- **Release Approval:** Final sign-off on production releases
- **Architecture:** Design system boundaries, API contracts
- **Monitoring:** Watch production health, respond to critical alerts
- **Mentorship:** Guide team on best practices

### JO (Product Owner)
- **Requirement Definition:** Define features, acceptance criteria
- **Staging Review:** Test features on staging before production
- **Release Planning:** Prioritize features for weekly releases
- **User Feedback:** Gather feedback, file bugs

### Blossom (Backend)
- **API Development:** Build backend endpoints, business logic
- **Database Work:** Write migrations (with Guy's guidance)
- **Feature Branches:** Create feature branches, submit PRs
- **Testing:** Write unit tests for backend code

### Bubbles (Frontend)
- **UI Development:** Build React components, pages
- **Integration:** Connect UI to backend APIs
- **Feature Branches:** Create feature branches, submit PRs
- **Testing:** Write component tests

### Buttercup (QA)
- **Test Planning:** Define test cases, acceptance criteria
- **Staging Testing:** Test features on staging before release
- **Regression Testing:** Run smoke tests after deployments
- **Bug Reporting:** File detailed bug reports with reproduction steps

### Guy (DBA)
- **Schema Design:** Design database tables, indexes
- **Migration Writing:** Create SQL migration files
- **Query Optimization:** Tune slow queries
- **Backup Management:** Ensure backups are working

### Pushpa (UI/UX & 3D)
- **Design System:** Maintain design tokens, components
- **Asset Creation:** Create 3D models, animations
- **Visual QA:** Review UI on staging for design consistency

---

## 10. Migration Plan

### From Current State to Target State

**Current State:**
- `production` branch → cubiqo.ai (production)
- `main` branch → development (not deployed)

**Target State:**
- `main` → development (not deployed, CI only)
- `staging` → staging.cubiqo.ai (auto-deploy)
- `production` → cubiqo.ai (auto-deploy)

### Step-by-Step Migration

#### **Step 1: Create Staging Supabase Project** (1 hour)
```bash
# 1. Go to supabase.com
# 2. Create new project: "cubiqo-staging"
# 3. Copy connection strings
# 4. Apply migrations
supabase link --project-ref <staging-ref>
supabase db push
```

#### **Step 2: Create Staging Branch** (5 minutes)
```bash
git checkout main
git pull
git checkout -b staging
git push origin staging
```

#### **Step 3: Configure Vercel for Staging** (15 minutes)
```
1. Go to vercel.com/thecubiqo/thecubiqo/settings
2. Add "staging" to production branches
3. Set environment variables for staging:
   - NEXT_PUBLIC_SUPABASE_URL → staging project URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY → staging anon key
4. Set custom domain: staging.cubiqo.ai
5. Save settings
```

#### **Step 4: Update CI/CD** (30 minutes)
```yaml
# .github/workflows/ci.yml
# Add staging deployment job (see section 3)
```

#### **Step 5: Test Staging Deployment** (15 minutes)
```bash
# Push to staging
git checkout staging
git push origin staging

# Wait for Vercel deployment
# Visit staging.cubiqo.ai
# Verify it works
```

#### **Step 6: Update Team Workflow** (Communication)
- Send message to team explaining new workflow
- Update README.md with new branching strategy
- Update PR template with new process

#### **Step 7: Establish Release Cadence** (Ongoing)
- Set up weekly Friday releases
- Create release checklist
- Automate notifications

---

## Summary

### Key Takeaways

1. **Three Environments**: Dev (main) → Staging (staging) → Prod (production)
2. **Weekly Releases**: Every Friday at 2 PM UTC
3. **Feature Flags**: Use for gradual rollouts and instant rollbacks
4. **Automated Deployments**: Vercel auto-deploys staging and production
5. **Database Separation**: Staging and production use separate Supabase projects
6. **Hotfix Process**: Fast-track critical fixes directly to production

### Upcoming Features (Dashboard & Journal)

**Recommended Approach:**
1. **Create feature branch** from main: `feature/dashboard-ui`
2. **Develop behind feature flag**: `dashboard_ui` (initially disabled)
3. **Merge to main** after code review (MO approves)
4. **Deploy to staging** in next weekly release
5. **QA testing** on staging (Buttercup + JO)
6. **Deploy to production** with flag OFF
7. **Enable flag** for internal users first
8. **Gradual rollout**: 10% → 50% → 100%
9. **Remove flag** after 2 weeks of stability

### Next Actions

- [ ] **MO**: Create staging Supabase project
- [ ] **MO**: Configure Vercel for staging environment
- [ ] **MO**: Create staging branch
- [ ] **MO**: Update CI/CD workflows
- [ ] **MO**: Test staging deployment
- [ ] **Team**: Review and acknowledge new workflow
- [ ] **JO**: Plan first weekly release

---

**Questions?** Ping MO (CTO) for clarification or guidance.

**Document Version:** 1.0  
**Last Updated:** February 17, 2025  
**Next Review:** March 17, 2025

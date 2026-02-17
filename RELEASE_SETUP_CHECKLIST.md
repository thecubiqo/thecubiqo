# Release Process - Implementation Checklist

**Owner:** MO (CTO)  
**Timeline:** 2-3 hours  
**Status:** Not Started

This checklist guides the setup of the three-environment release strategy.

---

## Prerequisites

- [ ] Access to Vercel project settings
- [ ] Access to Supabase account
- [ ] Admin access to GitHub repository
- [ ] DNS management for cubiqo.ai (to add staging subdomain)

---

## Phase 1: Staging Supabase Project (30 minutes)

### Step 1.1: Create Staging Database

- [ ] **Go to:** [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] **Click:** "New Project"
- [ ] **Name:** `cubiqo-staging`
- [ ] **Region:** Same as production (for consistency)
- [ ] **Database Password:** Generate strong password (save in 1Password/secrets manager)
- [ ] **Wait:** ~2 minutes for project to provision
- [ ] **Copy:** Project URL and Anon Key (save for later)

### Step 1.2: Apply Migrations to Staging

```bash
# Link to staging project
supabase link --project-ref <staging-project-ref>

# Apply all existing migrations
supabase db push

# Verify schema
supabase db diff

# Seed test data (optional)
psql $STAGING_DATABASE_URL < supabase/seed.sql
```

**Verify:**
- [ ] All tables exist in staging database
- [ ] RLS policies are active
- [ ] Test data seeded (if using seed.sql)

### Step 1.3: Document Connection Details

Create `.env.staging` (DO NOT COMMIT):

```bash
# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>

# ElevenLabs (use same as dev)
ELEVENLABS_API_KEY=<dev-key>

# Other services (use test/dev keys)
NODE_ENV=production
```

---

## Phase 2: Create Staging Branch (10 minutes)

### Step 2.1: Create Branch Locally

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create staging branch from main
git checkout -b staging

# Push to GitHub
git push origin staging
```

### Step 2.2: Protect Staging Branch

- [ ] **Go to:** GitHub → Settings → Branches
- [ ] **Click:** "Add branch protection rule"
- [ ] **Branch name pattern:** `staging`
- [ ] **Enable:**
  - [x] Require pull request reviews before merging (1 approval)
  - [x] Require status checks to pass (CI/CD)
  - [x] Require branches to be up to date
  - [x] Include administrators (even MO must follow process)
- [ ] **Save changes**

### Step 2.3: Update Repository Settings

- [ ] **Go to:** GitHub → Settings → General
- [ ] **Default branch:** Keep as `main` (dev branch)
- [ ] **Confirm:** main, staging, production all exist

---

## Phase 3: Configure Vercel Staging (45 minutes)

### Step 3.1: Add Staging Environment

- [ ] **Go to:** [vercel.com/thecubiqo/thecubiqo/settings](https://vercel.com)
- [ ] **Navigate to:** Settings → Git
- [ ] **Production Branch:** Currently `production` ✓ (keep)
- [ ] **Add Preview Branch:** `staging`
- [ ] **Enable:** "Auto-deploy" for staging branch

### Step 3.2: Configure Staging Environment Variables

- [ ] **Navigate to:** Settings → Environment Variables
- [ ] **Add staging-specific variables:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<staging-ref>.supabase.co` | Preview (staging) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<staging-anon-key>` | Preview (staging) |
| `SUPABASE_SERVICE_ROLE_KEY` | `<staging-service-key>` | Preview (staging) |
| `NODE_ENV` | `production` | Preview (staging) |
| `NEXT_PUBLIC_ENV_NAME` | `staging` | Preview (staging) |

**Note:** Keep production variables separate (already configured).

### Step 3.3: Configure Custom Domain for Staging

- [ ] **Navigate to:** Settings → Domains
- [ ] **Add Domain:** `staging.cubiqo.ai`
- [ ] **Assign to Branch:** `staging`
- [ ] **Wait for DNS propagation:** ~5-10 minutes

**DNS Configuration:**

If not auto-configured, add this CNAME record in your DNS provider:

```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 3.4: Verify Staging Deployment

- [ ] **Push to staging branch:**
  ```bash
  git checkout staging
  git push origin staging
  ```
- [ ] **Wait:** ~2 minutes for Vercel to build and deploy
- [ ] **Check:** Vercel dashboard shows successful deployment
- [ ] **Visit:** `https://staging.cubiqo.ai`
- [ ] **Test:**
  - [ ] Site loads
  - [ ] Can sign in with test account
  - [ ] Cube animation works
  - [ ] Voice interaction works (if enabled)

---

## Phase 4: Update CI/CD (30 minutes)

### Step 4.1: Enhance GitHub Actions Workflow

Edit `.github/workflows/ci.yml`:

```bash
# Open file
vim .github/workflows/ci.yml
```

Add these jobs:

```yaml
# Add after existing jobs

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-test
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deployment notification
        run: echo "🚀 Deploying to staging.cubiqo.ai"
      
      - name: Wait for Vercel deployment
        run: sleep 120
      
      - name: Run smoke tests
        run: |
          echo "Running smoke tests on staging..."
          curl -f https://staging.cubiqo.ai || exit 1
      
      - name: Notify team
        run: echo "✅ Deployed to staging.cubiqo.ai"

  deploy-production:
    name: Deploy to Production
    needs: build-and-test
    if: github.ref == 'refs/heads/production' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deployment notification
        run: echo "🚀 Deploying to cubiqo.ai"
      
      - name: Wait for Vercel deployment
        run: sleep 120
      
      - name: Run smoke tests
        run: |
          echo "Running smoke tests on production..."
          curl -f https://cubiqo.ai || exit 1
      
      - name: Monitor error rates
        run: echo "📊 Monitoring error rates..."
      
      - name: Notify team
        run: echo "✅ Deployed to cubiqo.ai"
```

**Commit changes:**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: Add staging and production deployment jobs"
git push origin staging
```

### Step 4.2: Test CI/CD Pipeline

- [ ] **Push to staging:**
  ```bash
  git checkout staging
  git push origin staging
  ```
- [ ] **Check GitHub Actions:** Verify workflow runs
- [ ] **Verify:** `deploy-staging` job runs and succeeds
- [ ] **Check:** staging.cubiqo.ai updates

### Step 4.3: Add Status Badge to README

Edit `README.md`:

```markdown
# CubiQo

![CI Status](https://github.com/thecubiqo/thecubiqo/workflows/CI/badge.svg?branch=main)

**Environments:**
- 🟢 Production: [cubiqo.ai](https://cubiqo.ai)
- 🟡 Staging: [staging.cubiqo.ai](https://staging.cubiqo.ai)
- 🔵 Development: localhost:3000
```

---

## Phase 5: Documentation Updates (20 minutes)

### Step 5.1: Update README.md

- [ ] Add section on environments
- [ ] Add section on branching strategy
- [ ] Add links to RELEASE_STRATEGY.md and RELEASE_QUICK_REF.md

Example:

```markdown
## 🚀 Deployment

We use a three-environment deployment strategy:

| Environment | URL | Branch | Purpose |
|------------|-----|--------|---------|
| **Development** | localhost:3000 | `main` | Active development |
| **Staging** | staging.cubiqo.ai | `staging` | Pre-production testing |
| **Production** | cubiqo.ai | `production` | Live site |

**See full documentation:** [RELEASE_STRATEGY.md](./RELEASE_STRATEGY.md)

**Quick reference:** [RELEASE_QUICK_REF.md](./RELEASE_QUICK_REF.md)
```

### Step 5.2: Update CONTRIBUTING.md (if exists)

Add branching workflow:

```markdown
## Branching Strategy

1. Create feature branch from `main`: `feature/my-feature`
2. Develop and test locally
3. Create PR to `main`
4. After code review and merge, feature goes to `staging` in weekly release
5. After QA approval, `staging` is merged to `production`
```

### Step 5.3: Create PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe what this PR does -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
<!-- How has this been tested? -->
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested on staging

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Updated documentation (if needed)
- [ ] No new warnings
- [ ] Added tests (if applicable)
- [ ] All tests pass
```

---

## Phase 6: Team Onboarding (15 minutes)

### Step 6.1: Notify Team

Send message to team (Slack/Discord/Email):

```
📢 New Release Process Implemented

We now have a three-environment deployment strategy:

🔵 **Development** (main branch) → localhost:3000
   - Active development happens here
   - Create feature branches from main
   - Merge via PR after code review

🟡 **Staging** (staging branch) → staging.cubiqo.ai
   - Pre-production testing
   - QA tests here before production release
   - Updated weekly with features from main

🟢 **Production** (production branch) → cubiqo.ai
   - Live site, real users
   - Only stable, tested code
   - Released every Friday at 2 PM UTC

📚 **Docs:**
- Full strategy: RELEASE_STRATEGY.md
- Quick reference: RELEASE_QUICK_REF.md

Questions? Ping MO (@mo)
```

### Step 6.2: Schedule First Release

- [ ] **Pick date:** Next Friday at 2 PM UTC
- [ ] **Create calendar event:** "Weekly Release to Production"
- [ ] **Invite:** Whole team
- [ ] **Recurring:** Every Friday

### Step 6.3: Create Release Checklist Issue Template

Create `.github/ISSUE_TEMPLATE/release.md`:

```markdown
---
name: Weekly Release
about: Checklist for weekly production release
title: 'Release: YYYY-MM-DD'
labels: release
assignees: mo

---

## Release Checklist

**Release Date:** YYYY-MM-DD  
**Release Manager:** MO

### Wednesday: Planning
- [ ] JO reviews staging features
- [ ] MO reviews code quality
- [ ] Buttercup confirms all tests pass
- [ ] Identify any release blockers
- [ ] Update CHANGELOG.md

### Thursday: Final Testing
- [ ] QA smoke tests on staging
- [ ] Performance benchmarks
- [ ] Security scan
- [ ] Backup production database
- [ ] Notify stakeholders

### Friday: Release
- [ ] 2:00 PM UTC: Merge staging → production
- [ ] Vercel auto-deploys
- [ ] Run smoke tests
- [ ] Manual verification
- [ ] Monitor error rates (15 min)
- [ ] Notify team: ✅ Release successful

### Post-Release
- [ ] Monitor error rates (24 hours)
- [ ] Check user feedback
- [ ] Review analytics
```

---

## Phase 7: Validation (20 minutes)

### Step 7.1: End-to-End Test

**Simulate full workflow:**

1. **Create test feature branch:**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/test-release-process
   
   # Make trivial change
   echo "# Test Release Process" >> TEST_RELEASE.md
   git add TEST_RELEASE.md
   git commit -m "test: Validate release process"
   git push origin feature/test-release-process
   ```

2. **Create PR to main:**
   ```bash
   gh pr create --base main --title "Test Release Process" --body "Validating new release workflow"
   ```

3. **Review and merge PR (as MO)**

4. **Merge main → staging:**
   ```bash
   git checkout staging
   git pull origin staging
   git merge main --no-ff -m "Weekly release: test"
   git push origin staging
   ```

5. **Verify staging deployment:**
   - [ ] Visit staging.cubiqo.ai
   - [ ] Check that TEST_RELEASE.md is visible (if public)

6. **Merge staging → production:**
   ```bash
   git checkout production
   git pull origin production
   git merge staging --no-ff -m "Release: test"
   git push origin production
   ```

7. **Verify production deployment:**
   - [ ] Visit cubiqo.ai
   - [ ] Check that TEST_RELEASE.md is visible

8. **Clean up:**
   ```bash
   git checkout main
   git branch -D feature/test-release-process
   git push origin --delete feature/test-release-process
   ```

### Step 7.2: Validate Feature Flags

- [ ] Go to staging.cubiqo.ai/admin/feature-flags
- [ ] Create test flag: `test_release_flag`
- [ ] Enable flag
- [ ] Verify flag works in staging
- [ ] Disable flag

### Step 7.3: Validate Rollback

**Test Vercel rollback:**

1. Go to Vercel → Deployments
2. Find previous deployment
3. Click "Promote to Production"
4. Verify rollback works

---

## Completion Checklist

### Infrastructure
- [ ] Staging Supabase project created and configured
- [ ] Staging branch created and protected
- [ ] Vercel configured for staging environment
- [ ] staging.cubiqo.ai domain configured and working
- [ ] CI/CD updated with deployment jobs

### Documentation
- [ ] RELEASE_STRATEGY.md created
- [ ] RELEASE_QUICK_REF.md created
- [ ] README.md updated
- [ ] PR template created
- [ ] Release issue template created

### Team
- [ ] Team notified of new process
- [ ] First release scheduled
- [ ] Docs shared with team

### Validation
- [ ] End-to-end workflow tested
- [ ] Staging deployment verified
- [ ] Production deployment verified
- [ ] Feature flags tested
- [ ] Rollback tested

---

## Success Criteria

✅ All checklist items completed  
✅ Staging environment fully functional  
✅ Production environment unchanged (until first release)  
✅ Team trained on new workflow  
✅ Documentation complete

---

## Rollback Plan

If something goes wrong during setup:

1. **Staging issues:** Delete staging branch, recreate
2. **Vercel issues:** Revert domain settings
3. **Supabase issues:** Delete staging project, recreate
4. **Production issues:** Should not be affected (only staging changes)

---

## Next Steps (After Setup)

1. **Week 1:** Operate in new workflow, gather feedback
2. **Week 2:** First real release using new process
3. **Week 3:** Retrospective, refine process
4. **Month 2:** Automate more (notifications, monitoring)

---

**Estimated Time:** 2-3 hours  
**Priority:** High  
**Owner:** MO (CTO)

**Questions?** Review RELEASE_STRATEGY.md or contact MO.

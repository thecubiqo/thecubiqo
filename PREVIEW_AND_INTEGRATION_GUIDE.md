# Preview Deployments & Branch Integration Guide

**Date:** 2026-02-14  
**Status:** 🎯 COMPREHENSIVE GUIDE

---

## 📋 Table of Contents

1. [Question 1: How to Preview copilot/debug-code-issues](#question-1-preview-copilot-branch)
2. [Question 2: Database Configuration for Previews](#question-2-database-configuration)
3. [Question 3: Production Branch Features Comparison](#question-3-production-vs-copilot)
4. [Question 4: Emergent Designs Integration](#question-4-emergent-designs-integration)
5. [Question 5: Supabase Direct Access](#question-5-supabase-capabilities)
6. [Question 6: How to Preview Production Branch](#question-6-preview-production-branch)

---

## Question 1: How to Preview copilot/debug-code-issues?

### 🎯 Answer: Use Vercel Preview Deployments

**YES!** You can preview any branch before pushing to production.

### Method A: Automatic Vercel Preview (Recommended)

**How it Works:**
- Vercel automatically creates preview deployments for ALL branches
- Each push to any branch creates a unique preview URL
- No configuration needed (already enabled)

**Steps:**

1. **Push your branch (if not already pushed):**
   ```bash
   git checkout copilot/debug-code-issues
   git push origin copilot/debug-code-issues
   ```

2. **Get Preview URL:**
   - Go to Vercel Dashboard → cubiqo project
   - Click "Deployments" tab
   - Find deployment for `copilot/debug-code-issues` branch
   - Click to see preview URL

3. **Preview URL Format:**
   ```
   https://cubiqo-repo-git-copilot-debug-code-issues-cubiqo-projects.vercel.app
   ```

4. **Test Your Changes:**
   - Visit the preview URL
   - Test auth flow
   - Check all features
   - Verify no errors

### Method B: Create Vercel Preview Branch

**Configure specific preview branch:**

```json
// vercel.json - add this
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "copilot/debug-code-issues": true,
      "preview": true
    }
  }
}
```

### Method C: Create Preview Branch

**Create dedicated preview branch:**

```bash
# Create preview branch from copilot
git checkout copilot/debug-code-issues
git checkout -b preview
git push origin preview

# Vercel will auto-deploy to:
# https://cubiqo-repo-git-preview-cubiqo-projects.vercel.app
```

### Method D: Local Preview

**Test locally before deploying:**

```bash
# Clone and test locally
git checkout copilot/debug-code-issues
npm install
npm run build
npm start

# Visit http://localhost:3000
```

---

## Question 2: Database Configuration for Previews

### 🎯 Answer: Use Separate Supabase Projects or Environment Variables

**Your Concern is Valid!** Preview and production should NOT share the same database.

### Problem:

```
Current State:
├─ Production (main): Uses Production Supabase
├─ Preview (copilot): Also uses Production Supabase ❌
└─ Risk: Preview changes affect live data!
```

### Solution A: Separate Supabase Projects (Recommended)

**Create Development Supabase Project:**

1. **Go to Supabase Dashboard**
   - Create new project: `cubiqo-development`
   - Copy connection details

2. **Configure Vercel Environment Variables**
   
   **For Production:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
   ```

   **For Preview:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
   ```

3. **Set in Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add variables for "Preview" environment
   - Add different variables for "Production" environment

### Solution B: Branch-Specific Environment Variables

**Configure in Vercel:**

```
Environment: Preview
Branch: copilot/debug-code-issues
Variables:
  NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
  SUPABASE_SERVICE_ROLE_KEY=dev-service-key
  
Environment: Production  
Branch: main
Variables:
  NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
  SUPABASE_SERVICE_ROLE_KEY=prod-service-key
```

### Solution C: Database Branch (Supabase Feature)

**Use Supabase Branches (if available):**

1. In Supabase Dashboard
2. Create branch from production
3. Use branch connection for previews
4. Merge branch to production when ready

### How to Bypass Database Errors

**Temporary Testing Without Database:**

```typescript
// src/lib/supabase/client.ts
export function createClient() {
  // Check if we're in preview mode without proper DB
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const hasValidDb = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
  
  if (isPreview && !hasValidDb) {
    // Return mock client for testing UI only
    return createMockSupabaseClient()
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Best Practice: Complete Setup

```yaml
Deployment Strategy:
├─ Production:
│  ├─ Branch: main
│  ├─ Database: Production Supabase
│  └─ URL: www.cubiqo.ai
│
├─ Staging:
│  ├─ Branch: preview
│  ├─ Database: Staging Supabase
│  └─ URL: preview.cubiqo.ai
│
└─ Development:
   ├─ Branch: copilot/*, feature/*
   ├─ Database: Development Supabase
   └─ URL: [branch-name].vercel.app
```

---

## Question 3: Production Branch (94e6e86) vs Copilot Branch

### 🎯 Answer: YES! Production Branch Has Many Features Copilot Doesn't Have

**IMPORTANT DISCOVERY:** Production branch has significantly more features!

### Feature Comparison:

| Feature | Production (94e6e86) | Copilot (a934968) |
|---------|---------------------|-------------------|
| **32 Features Delivered** | ✅ YES | ❌ NO |
| **Agent Coordination** | ✅ YES | ❌ NO |
| **Code Execution APIs** | ✅ YES | ❌ NO |
| **File Operations API** | ✅ YES | ❌ NO |
| **Terminal API** | ✅ YES | ❌ NO |
| **3D Agent Activity Cube** | ✅ YES | ❌ NO |
| **Glassy Particle Cube** | ✅ YES | ❌ NO |
| **Live Coding Stream** | ✅ YES | ❌ NO |
| **Monaco Editor** | ✅ YES | ❌ NO |
| **Voice + Swift Support** | ✅ YES | ❌ NO |
| **Auth Error Page** | ❌ NO | ✅ YES |
| **Build Fixes** | ❌ NO | ✅ YES |
| **Environment Validation** | ❌ NO | ✅ YES |
| **Comprehensive Docs** | ❌ NO | ✅ YES |

### Production Branch Features (Not in Copilot):

**Commits Unique to Production:**
```
94e6e86 - fix: Use @monaco-editor/react instead of direct import
962e8d8 - feat: Complete CubiQo = Clawdbot - All 32 features delivered
2d66419 - chore: Remove secrets from repo
6e8f7e2 - fix: Remove test files causing TS errors
ebb67ed - trigger: Force rebuild
15bb19a - fix: Import order for GlassyAgentCube
1bcb34e - feat: Glassy particle cube visualization 🌌
1361d55 - feat: 3D Agent Activity Cube 🎲
8bea486 - feat: Live coding activity stream 🔴
b03aa2b - feat: Henry's Phase 2 coordination plan
b7639a6 - feat: Phase 2 - Full agent team
89d22a8 - fix: Next.js 15 async params + duplicate git tool
d48ba5f - feat: Voice + Swift support
80c643d - feat: Phase 1 - Agent coordination complete
d800609 - feat: Add git tool for agent self-commits
```

### Copilot Branch Features (Not in Production):

**Commits Unique to Copilot:**
```
f378f14 - Complete passedesigns branch analysis
a934968 - Add urgent action guide for production
d6aa033 - Add production issues analysis and speaker button fix
2407fc4 - Fix auth callback 404 by adding error page
2d1e433 - Add Supabase configuration to .env.example
5f0298e - Complete environment validation
b4f7876 - Add auth troubleshooting guide
d12013a - Add auth fix summary
4644ee4 - Add branch structure documentation
868fed5 - Add deployment summary
```

### What This Means:

**Production Branch = Feature-Rich Application**
- Has the core application features
- 32 features delivered
- Agent system, code execution, 3D visualizations
- BUT: Missing auth fixes, environment validation, docs

**Copilot Branch = Fixes & Documentation**
- Has critical bug fixes (auth 404)
- Has build fixes (TypeScript, fonts)
- Has comprehensive documentation
- BUT: Missing all the advanced features

### Recommended Strategy: MERGE BOTH BRANCHES

**You need BOTH:**
1. Production features (the app)
2. Copilot fixes (making it work)

**Merge Strategy:**

```bash
# Option A: Merge Production → Copilot
git checkout copilot/debug-code-issues
git merge temp-production
# Resolve conflicts
git push origin copilot/debug-code-issues

# Option B: Create Hybrid Branch
git checkout production
git checkout -b production-with-fixes
git merge copilot/debug-code-issues
# Resolve conflicts
git push origin production-with-fixes

# Option C: Merge Both to Main
git checkout main
git merge production
git merge copilot/debug-code-issues
# Resolve conflicts
git push origin main
```

**Conflicts to Expect:**
- API routes (execute, file-ops, terminal, memory)
- Layout file (font changes)
- Package files
- Documentation overlap

---

## Question 4: Emergent Designs Integration

### 🎯 Answer: YES! I Can Integrate Designs Into Copilot Branch

**Capabilities:**

### What I CAN Do: ✅

1. **Integrate Frontend Designs**
   - Receive your design files (components, styles, assets)
   - Integrate into copilot/debug-code-issues branch
   - Update imports and dependencies
   - Fix TypeScript errors
   - Ensure components work together

2. **Handle Dependencies**
   - Install required npm packages
   - Update package.json
   - Resolve dependency conflicts
   - Run security checks
   - Test build process

3. **Component Integration**
   - Import your components
   - Connect to existing state management
   - Wire up API calls
   - Add proper TypeScript types
   - Ensure responsive design

4. **Testing & Validation**
   - Test components render correctly
   - Verify no TypeScript errors
   - Check for console warnings
   - Validate build succeeds
   - Run linting

5. **Documentation**
   - Document new components
   - Update README
   - Add usage examples
   - Create component docs

### What I CANNOT Do: ❌

1. **Access Emergent Software Directly**
   - Cannot log into emergent
   - Cannot pull from emergent automatically
   - You need to export and provide files

2. **Make Design Decisions**
   - Cannot change your designs
   - Cannot alter UI/UX choices
   - Will implement as provided

3. **Access External Services Without Credentials**
   - Cannot modify Supabase directly
   - Cannot deploy to Vercel directly
   - You need to provide access

### How to Provide Designs:

**Method A: Share Files Directly**

1. Export from emergent software:
   ```
   - Component files (.tsx, .jsx)
   - Style files (.css, .scss, .module.css)
   - Asset files (images, icons, fonts)
   - Configuration files
   ```

2. Share via:
   - GitHub commit to branch
   - Paste code in chat
   - Share as archive (.zip)

3. I will:
   - Integrate into copilot branch
   - Fix any issues
   - Test everything works

**Method B: Push to GitHub Branch**

```bash
# You push designs to a branch
git checkout -b emergent-designs
# Add your design files
git add src/components/[your-components]
git commit -m "feat: Add high-end designs from emergent"
git push origin emergent-designs

# I merge into copilot branch
git checkout copilot/debug-code-issues
git merge emergent-designs
# Fix conflicts, test, commit
git push origin copilot/debug-code-issues
```

**Method C: Provide Design Specs**

If you can't export files:
- Share screenshots
- Describe components
- Provide CSS/Tailwind classes
- I'll recreate based on specs

### Integration Process:

1. **Receive Designs** ✅
   - You provide files/code
   - I review structure

2. **Analyze Dependencies** ✅
   - Check required packages
   - Identify conflicts
   - Plan integration

3. **Integrate Code** ✅
   - Add to copilot branch
   - Update imports
   - Fix types

4. **Test Build** ✅
   - npm install
   - npm run build
   - Fix errors

5. **Validate Features** ✅
   - Test components render
   - Check functionality
   - Verify no regressions

6. **Document Changes** ✅
   - Update docs
   - Add comments
   - Create PR description

---

## Question 5: Supabase Direct Access

### 🎯 Answer: Limited Direct Access - Need Your Credentials

### What I CAN Do: ✅

1. **Review Configuration**
   - Read Supabase client setup
   - Check connection code
   - Review API usage
   - Identify issues

2. **Generate SQL Scripts**
   - Create migration files
   - Write schema updates
   - Generate seed data
   - Create RLS policies

3. **Code Review**
   - Review Supabase queries
   - Check security (RLS)
   - Optimize queries
   - Fix bugs

4. **Documentation**
   - Document database schema
   - Create setup guides
   - Write API docs
   - Add examples

5. **Generate Supabase Code**
   - Client initialization
   - Auth hooks
   - Database queries
   - Realtime subscriptions

### What I CANNOT Do: ❌

1. **Direct Database Access**
   - Cannot log into your Supabase dashboard
   - Cannot execute queries directly
   - Cannot view your data
   - Cannot modify tables directly

2. **Deploy Migrations**
   - Cannot run migrations for you
   - Cannot create tables
   - Cannot update schema
   - You need to execute SQL

3. **Access Supabase Dashboard**
   - Cannot change settings
   - Cannot view logs
   - Cannot manage auth
   - Cannot configure storage

4. **Real-Time Testing**
   - Cannot test with your live database
   - Cannot verify data integrity
   - Cannot check connections

### How We Work Together:

**Workflow:**

```
You Provide:
├─ Supabase project URL
├─ Connection strings (if needed for review)
├─ Database schema/requirements
└─ Access to test/view issues

I Generate:
├─ SQL migration files
├─ TypeScript types for tables
├─ Client configuration code
├─ Security policies (RLS)
└─ Documentation

You Execute:
├─ Run migrations in Supabase
├─ Update environment variables
├─ Test connections
└─ Verify everything works
```

**Example Collaboration:**

```sql
-- I create migration file
-- supabase/migrations/20240214_add_feature.sql

-- You need to run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.your_new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.your_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON public.your_new_table FOR SELECT
USING (auth.uid() = user_id);
```

### What You Need to Do:

1. **Provide Schema Information**
   - Current database structure
   - Required changes
   - Data relationships

2. **Execute SQL**
   - Copy generated SQL
   - Run in Supabase dashboard
   - Verify success

3. **Update Environment Variables**
   - Set in Vercel
   - Test connections
   - Verify access

4. **Share Feedback**
   - Report issues
   - Share error messages
   - Confirm success

---

## Question 6: How to Preview Production Branch

### 🎯 Answer: Same Methods as Copilot Branch

**You can preview the production branch (94e6e86) before deploying!**

### Method A: Vercel Preview Deployment

**Already Exists!**

Production branch likely already has preview deployments:

```
URL: https://cubiqo-repo-git-production-cubiqo-projects.vercel.app
```

**To verify:**
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find deployments for "production" branch
4. Click to see preview URL

### Method B: Create Preview from Production

```bash
# Create preview branch from production
git checkout production
git checkout -b preview-production
git push origin preview-production

# Vercel auto-deploys to:
# https://cubiqo-repo-git-preview-production-cubiqo-projects.vercel.app
```

### Method C: Deploy Production to Staging

**Create staging environment:**

```bash
# Merge production to preview branch
git checkout preview
git merge production
git push origin preview

# Configure Vercel:
# preview branch → staging.cubiqo.ai (custom domain)
```

### Method D: Local Testing

```bash
# Clone production branch
git checkout production
git fetch origin production
git checkout production

# Install and run
npm install
npm run build
npm start

# Test at http://localhost:3000
```

### Recommended Preview Strategy:

```yaml
Branch Structure:
├─ production (94e6e86)
│  ├─ Has 32 features
│  └─ Preview: [production-branch].vercel.app
│
├─ copilot/debug-code-issues
│  ├─ Has fixes + docs
│  └─ Preview: [copilot-branch].vercel.app
│
├─ production-with-fixes (NEW - merge both)
│  ├─ Has features + fixes
│  └─ Preview: [merged-branch].vercel.app
│
└─ main
   └─ Production: www.cubiqo.ai
```

---

## 🎯 Recommended Action Plan

### Phase 1: Preview & Test (Today)

1. **Preview Copilot Branch:**
   ```bash
   # Already exists at:
   https://cubiqo-repo-git-copilot-debug-code-issues-[...].vercel.app
   ```

2. **Preview Production Branch:**
   ```bash
   # Already exists at:
   https://cubiqo-repo-git-production-[...].vercel.app
   ```

3. **Test Both:**
   - Test copilot fixes
   - Test production features
   - Identify what you want

### Phase 2: Merge Best of Both (This Week)

**Option A: Add Features to Copilot**
```bash
git checkout copilot/debug-code-issues
git merge production
# Resolve conflicts
git push origin copilot/debug-code-issues
```

**Option B: Add Fixes to Production**
```bash
git checkout production
git merge copilot/debug-code-issues
# Resolve conflicts
git push origin production
```

**Option C: Create Perfect Branch**
```bash
git checkout -b ultimate-cubiqo production
git merge copilot/debug-code-issues
# Resolve conflicts
git push origin ultimate-cubiqo
# Preview at ultimate-cubiqo.vercel.app
```

### Phase 3: Add Emergent Designs

1. **Export from Emergent**
   - Get component files
   - Get styles
   - Get assets

2. **Push to Branch**
   ```bash
   git checkout -b emergent-designs
   # Add design files
   git push origin emergent-designs
   ```

3. **I Integrate Designs**
   - Merge to copilot or production
   - Fix dependencies
   - Test everything

### Phase 4: Configure Database

1. **Create Dev Supabase**
   - New project for previews
   - Copy schema from production
   - Seed with test data

2. **Set Vercel Variables**
   - Preview: Dev database
   - Production: Prod database

3. **Test Both Environments**
   - Preview works with dev DB
   - Production works with prod DB

### Phase 5: Deploy to Production

1. **Choose Best Branch**
   - Ultimate-cubiqo (all features + fixes)
   - Or production-with-fixes

2. **Merge to Main**
   ```bash
   git checkout main
   git merge [chosen-branch]
   git push origin main
   ```

3. **Vercel Auto-Deploys**
   - To www.cubiqo.ai
   - With production database

---

## 📞 Summary of Answers

### Question 1: Preview Copilot Branch ✅
- **Answer:** Use Vercel preview deployments (automatic)
- **URL:** `[branch-name].vercel.app`
- **Setup:** Already enabled, just push branch

### Question 2: Database for Previews ✅
- **Answer:** Create separate dev Supabase project
- **Setup:** Configure environment variables in Vercel
- **Bypass:** Use mock client or dev database

### Question 3: Production vs Copilot ✅
- **Answer:** YES! Production has 32 features copilot doesn't
- **Solution:** Need to MERGE both branches
- **Best:** Combine production features + copilot fixes

### Question 4: Emergent Integration ✅
- **Answer:** YES! I can integrate your designs
- **Process:** You provide files, I integrate + test
- **Result:** Working application with your UI/UX

### Question 5: Supabase Access ✅
- **Answer:** Limited - I generate SQL, you execute
- **I Do:** Create migrations, types, code
- **You Do:** Run SQL, configure, test

### Question 6: Preview Production ✅
- **Answer:** Same as copilot - Vercel preview
- **URL:** `production-branch.vercel.app`
- **Alternative:** Create preview-production branch

---

## 🚀 Next Steps

**What would you like to do?**

1. **Preview existing branches?**
   - I'll help find preview URLs

2. **Merge production + copilot?**
   - I'll create merged branch

3. **Set up dev database?**
   - I'll create configuration guide

4. **Integrate emergent designs?**
   - Share files, I'll integrate

5. **Deploy to production?**
   - Choose best branch, merge to main

**Let me know what you'd like to tackle first!** 🎯

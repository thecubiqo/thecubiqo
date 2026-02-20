# Which Branch Has What? Quick Reference

**Question:** "where which branch?"  
**Answer:** Here's what each branch contains.

---

## 🌿 Current Branch Structure

### **copilot/analyze-feature-branches** (Current Branch) 
📍 **You are here**

**What's in this branch:**
- ✅ **5 New Documentation Files:**
  1. `START_HERE_FEATURES.md` - Navigation guide
  2. `WHERE_ARE_THE_FEATURES.md` - Executive summary
  3. `FEATURE_LOCATION_MAP.md` - Detailed spec → code mapping
  4. `INTEGRATIONS_MAP.md` - Complete integration catalog
  5. `BRANCH_ANALYSIS.md` - Branch structure analysis

- ✅ **Analysis Results:**
  - Mapped 15+ core features to code locations
  - Catalogued 59 integrations (chat, AI, tools)
  - Implementation status: ~70% complete
  - All features documented with file paths

**Purpose:** Feature location analysis and documentation

---

## 📚 Historical Branches (From Documentation)

### **production** Branch
**Status:** ✅ Live (cubiqo.ai)

**What's in production:**
- 32 complete features delivered
- Monaco editor fix
- Stable, tested code
- Auto-deploys to cubiqo.ai via Vercel

**Key Features:**
- Full application codebase
- All validated features
- Production-ready configuration
- Semantic versioning commits

---

### **main** Branch
**Status:** ✅ Active Development

**What's in main:**
- Development/staging code
- Auto-commits from development tools
- Integration testing area
- Experimental features

**Characteristics:**
- Receives continuous updates
- Testing ground before production
- May have work-in-progress features

---

### **copilot/debug-code-issues** Branch
**Status:** 🔧 Feature Branch (Historical)

**What was developed here:**
- ✅ Auth 404 error page
- ✅ Environment validation tools
- ✅ Sign-in flow fixes
- ✅ Comprehensive auth documentation
- ✅ Security validation (0 vulnerabilities)

**Files Added/Modified:**
- `src/app/auth/error/page.tsx` (168 lines)
- `AUTH_TROUBLESHOOTING.md` (6,255 chars)
- `AUTH_FIX_SUMMARY.md` (7,522 chars)
- `scripts/validate-env.js`
- Updated `.env.example` with Supabase config

**Status:** Ready for merge (per historical documentation)

---

### **preview** Branch
**Status:** ⚠️ Staging

**Purpose:**
- Preview deployments
- Testing before production
- Vercel preview environments

---

### **master** Branch
**Status:** ⚠️ Deprecated (Legacy)

**Purpose:** Old default branch, now deprecated

---

## 🗺️ Feature Distribution Across Branches

### All Branches Share Core Codebase:

**Core Features (in all active branches):**
```
✅ RGY Router               - /src/lib/ai/policy-router.ts
✅ Color System             - /src/config/colors.ts
✅ Keywords Panel           - /src/components/KeywordPanel.tsx
✅ Isometric Cube UI        - /src/components/cube/* (10 files)
✅ Voice I/O                - /src/hooks/useSpeech*.ts
✅ Authentication           - /src/components/auth/* (15 files)
✅ BYO Mode                 - /src/components/byo/*
✅ CQ↔CQ System             - /src/lib/cq-to-cq/* (extensive)
✅ AI Models (11 providers) - /src/lib/ai/*
✅ Automation Tools         - /src/lib/verbal-commands/*
```

### Branch-Specific Additions:

**copilot/analyze-feature-branches:**
- ➕ Feature location documentation (5 files)
- ➕ Integration analysis
- ➕ Implementation status reports

**copilot/debug-code-issues:**
- ➕ Auth error handling improvements
- ➕ Environment validation scripts
- ➕ Auth troubleshooting guides

**production:**
- ➕ Production configuration
- ➕ Deployment settings
- ➕ 32 validated features

---

## 📊 Feature Implementation by Branch

| Feature Category | production | main | copilot branches |
|------------------|------------|------|------------------|
| Core Features | ✅ 85% | ✅ 85% | ✅ 85% |
| AI Models | ✅ 11/15 | ✅ 11/15 | ✅ 11/15 |
| Chat Providers | ✅ 2/15 | ✅ 2/15 | ✅ 2/15 |
| Automation | ✅ 9/12 | ✅ 9/12 | ✅ 9/12 |
| Documentation | ✅ Some | ✅ Some | ✅ Extensive |

**Note:** Most features exist across all branches. The main differences are:
- **production:** Stable, tested versions
- **main:** Latest development versions
- **Feature branches:** Specific improvements + documentation

---

## 🎯 Quick Answer to "Where Which Branch?"

### Where is the **complete, working application**?
→ **production** branch (live on cubiqo.ai)

### Where is **active development**?
→ **main** branch (staging/integration)

### Where is **feature location documentation**?
→ **copilot/analyze-feature-branches** (this branch!)

### Where are **auth fixes**?
→ **copilot/debug-code-issues** (ready to merge)

### Where should **new features** go?
→ Create a new branch from **main**, then PR to **main** → **production**

---

## 🔍 Finding Specific Features

### To find a feature's location:
1. Read [FEATURE_LOCATION_MAP.md](./FEATURE_LOCATION_MAP.md) - Maps spec to code
2. Read [INTEGRATIONS_MAP.md](./INTEGRATIONS_MAP.md) - Lists all integrations
3. Read [WHERE_ARE_THE_FEATURES.md](./WHERE_ARE_THE_FEATURES.md) - Quick summary

### All branches have the same core structure:
```
/src
├── /components     # UI components
├── /lib            # Business logic
│   ├── /ai         # AI models (11 providers)
│   ├── /verbal-commands  # Services (Gmail, Twitter, Uber, etc.)
│   ├── /cq-to-cq   # Communication system
│   └── /engine     # Tools & automation
└── /app/api        # API routes
```

---

## 💡 Key Insights

1. **Most features exist in ALL branches**
   - The codebase is shared
   - Branches differ in stability and specific improvements

2. **Branch purposes are clear:**
   - `production` = Stable, live code
   - `main` = Active development
   - Feature branches = Specific work

3. **Documentation is NOW comprehensive:**
   - Before: Scattered information
   - After: 5 detailed documents with exact locations

4. **Implementation status is HIGH:**
   - ~70% of spec is complete
   - Core features: 85%
   - AI infrastructure: 73%
   - Automation: 75%

---

## 📚 Related Documentation

- **[START_HERE_FEATURES.md](./START_HERE_FEATURES.md)** - Start here for navigation
- **[FEATURE_LOCATION_MAP.md](./FEATURE_LOCATION_MAP.md)** - Spec → code mapping
- **[INTEGRATIONS_MAP.md](./INTEGRATIONS_MAP.md)** - All integrations catalogued
- **[WHERE_ARE_THE_FEATURES.md](./WHERE_ARE_THE_FEATURES.md)** - Executive summary
- **[BRANCH_ANALYSIS.md](./BRANCH_ANALYSIS.md)** - Detailed branch analysis
- **[BRANCHES.md](./BRANCHES.md)** - Branch workflow guide

---

## ✨ Bottom Line

**Question:** "where which branch?"  
**Answer:** 

- **Features are EVERYWHERE** (shared codebase)
- **Stability varies by branch:**
  - production = most stable
  - main = active development
  - feature branches = specific work
- **Current branch** has comprehensive documentation
- **All locations** are now mapped in 5 detailed documents

**Start with [START_HERE_FEATURES.md](./START_HERE_FEATURES.md) for full navigation!** 🚀

---

**Last Updated:** 2026-02-18  
**Current Branch:** copilot/analyze-feature-branches

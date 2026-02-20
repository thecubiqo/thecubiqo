# Branch Links and File Locations Guide

**Generated:** 2026-02-17  
**Purpose:** Direct links to branches and unique file locations

---

## 🔗 GitHub Branch Links

### Main Branches

| Branch | Link | Status |
|--------|------|--------|
| **Production** | [https://github.com/thecubiqo/thecubiqo/tree/production](https://github.com/thecubiqo/thecubiqo/tree/production) | ✅ Deployed |
| **Main** | [https://github.com/thecubiqo/thecubiqo/tree/main](https://github.com/thecubiqo/thecubiqo/tree/main) | ✅ Primary Dev |
| **Preview** | [https://github.com/thecubiqo/thecubiqo/tree/preview](https://github.com/thecubiqo/thecubiqo/tree/preview) | ⚠️ Experimental |

### Comparison Links

| Comparison | Link |
|------------|------|
| **Main vs Production** | [https://github.com/thecubiqo/thecubiqo/compare/main...production](https://github.com/thecubiqo/thecubiqo/compare/main...production) |
| **Main vs Preview** | [https://github.com/thecubiqo/thecubiqo/compare/main...preview](https://github.com/thecubiqo/thecubiqo/compare/main...preview) |
| **Production vs Preview** | [https://github.com/thecubiqo/thecubiqo/compare/production...preview](https://github.com/thecubiqo/thecubiqo/compare/production...preview) |

---

## 🔴 Production Branch Unique Features

**Status:** 25 commits ahead of main  
**Extra Code:** 1,519 lines more than main  
**Branch Link:** [Production Branch](https://github.com/thecubiqo/thecubiqo/tree/production)

### 1️⃣ Storybook Component Stories (10+ files)

**Location:** `src/components/stories/`

All these files exist ONLY in production branch:

| File | Direct Link |
|------|-------------|
| **AuthButton.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/AuthButton.stories.tsx) |
| **AuthNudgeModal.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/AuthNudgeModal.stories.tsx) |
| **BYOSettings.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/BYOSettings.stories.tsx) |
| **FullscreenApp.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/FullscreenApp.stories.tsx) |
| **GettingStartedPanel.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/GettingStartedPanel.stories.tsx) |
| **KeywordPanel.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/KeywordPanel.stories.tsx) |
| **LoginForm.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/LoginForm.stories.tsx) |
| **RGYChatsModal.stories.tsx** | [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/RGYChatsModal.stories.tsx) |

**Browse Entire Folder:** [src/components/stories/](https://github.com/thecubiqo/thecubiqo/tree/production/src/components/stories)

**Purpose:** 
- Visual component testing with Storybook
- Interactive component documentation
- Isolated component development
- Visual regression testing

**File Sizes:** ~1KB - 1.4KB each (total ~9KB)

---

### 2️⃣ Admin Designs Page & API

**Admin UI Page:**
- **File:** `src/app/admin/designs/page.tsx`
- **Link:** [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/admin/designs/page.tsx)
- **Size:** 7.1 KB
- **Purpose:** Admin interface for managing design configurations

**Admin API Route:**
- **File:** `src/app/api/admin/designs/route.ts`
- **Link:** [View File](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/api/admin/designs/route.ts)
- **Size:** 5.8 KB
- **Purpose:** Backend API for design management operations

**Access:**
```
UI: /admin/designs
API: /api/admin/designs
```

---

### 3️⃣ Enhanced Landing Configuration

**Location:** Various files in production branch

**Key Files:**
- Landing environment configuration
- Runtime validation for landing variants
- Plasma Wave Field landing support

**Related Commits in Production:**
```
aea45a7 - feat: enable Plasma Wave Field landing with environment config support
0de4717 - fix: add runtime validation for landing variant env var
0c8dd15 - Add env-based landing configuration and router integration
```

**Files likely include:**
- Environment configuration files
- Landing page router enhancements
- Plasma wave field components

---

### 4️⃣ Production-Specific Hotfixes

**Recent Production Commits (not in main):**

| Commit | Description |
|--------|-------------|
| `8d1bcb5` | fix: Build errors - ChatInput useEffect and turbopack root config |
| `51771e2` | docs: add comprehensive conflict analysis for PR #92 |
| `cdf5382` | Fix dependency conflicts and build errors after main branch restructure |
| `0de4717` | fix: add runtime validation for landing variant env var |
| `fbcc1e9` | Fix comment consistency - update time reference to match 4-hour threshold |

**View All Production Commits:**
[Production commit history](https://github.com/thecubiqo/thecubiqo/commits/production)

---

## 🟡 Preview Branch Unique Features

**Status:** 211 commits ahead, 356 commits behind main (heavily diverged)  
**Branch Link:** [Preview Branch](https://github.com/thecubiqo/thecubiqo/tree/preview)

### Key Unique Features in Preview:

#### 1️⃣ Agent System (7 Agents)

⚠️ **Note:** The agent files mentioned in the analysis may be in `.github/agents/` directory, but this directory structure may have changed in preview branch.

**Expected Agent Files:**
- `blossom.agent.md` - Backend Developer
- `bubbles.agent.md` - Frontend Developer  
- `buttercup.agent.md` - QA & Testing
- `guy.agent.md` - Database Administrator
- `jo.agent.md` - Product Owner
- `mo.agent.md` - CTO/Architect
- `pushpa.agent.md` - UI/UX Designer

**Browse Preview Branch:** [Preview root](https://github.com/thecubiqo/thecubiqo/tree/preview)

#### 2️⃣ Chromatic Visual Testing

**Expected Files:**
- `.github/workflows/chromatic.yml` - Chromatic CI workflow
- Storybook configuration for visual regression testing

#### 3️⃣ TTS & Voice Improvements

**Key Commits in Preview:**
```
- Redesign CubiQo's voice - warm, expressive, unique character
- Fix TTS audio cutting off after first sentence
- Fix: AI Router error handling and Supabase null check
```

#### 4️⃣ UI Reorganization

**Preview-specific changes:**
- Reorganized UI layout per user request
- Updated environment variable names to match Vercel config
- Various UI/UX improvements

**Status:** ⚠️ Preview is 356 commits BEHIND main - very stale and needs review

---

## 📊 Quick Access Table

| Feature | Branch | Location | Link |
|---------|--------|----------|------|
| **Storybook Stories** | Production | `src/components/stories/` | [Browse](https://github.com/thecubiqo/thecubiqo/tree/production/src/components/stories) |
| **Admin Designs UI** | Production | `src/app/admin/designs/page.tsx` | [View](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/admin/designs/page.tsx) |
| **Admin Designs API** | Production | `src/app/api/admin/designs/route.ts` | [View](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/api/admin/designs/route.ts) |
| **Landing Config** | Production | Various files | [Compare](https://github.com/thecubiqo/thecubiqo/compare/main...production) |
| **Production Hotfixes** | Production | Various files | [Commits](https://github.com/thecubiqo/thecubiqo/commits/production) |
| **Agent System** | Preview | `.github/agents/` (expected) | [Browse](https://github.com/thecubiqo/thecubiqo/tree/preview) |
| **Chromatic Workflow** | Preview | `.github/workflows/chromatic.yml` | [Browse](https://github.com/thecubiqo/thecubiqo/tree/preview/.github/workflows) |

---

## 🔍 How to Explore These Features

### View Storybook Stories in Production

1. **Browse All Stories:**
   ```
   https://github.com/thecubiqo/thecubiqo/tree/production/src/components/stories
   ```

2. **View Individual Story:**
   ```
   https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/[FILENAME]
   ```

3. **Compare with Main:**
   ```
   https://github.com/thecubiqo/thecubiqo/compare/main...production#files_bucket
   ```

### View Admin Designs System

**Admin UI Page:**
```
https://github.com/thecubiqo/thecubiqo/blob/production/src/app/admin/designs/page.tsx
```

**Admin API Route:**
```
https://github.com/thecubiqo/thecubiqo/blob/production/src/app/api/admin/designs/route.ts
```

### View Production Hotfixes

**See all production commits:**
```
https://github.com/thecubiqo/thecubiqo/commits/production
```

**Compare production with main:**
```
https://github.com/thecubiqo/thecubiqo/compare/main...production
```

### Explore Preview Branch

**Preview branch root:**
```
https://github.com/thecubiqo/thecubiqo/tree/preview
```

**Compare preview with main:**
```
https://github.com/thecubiqo/thecubiqo/compare/main...preview
```

---

## 📋 Summary

### Production Branch Extras (vs Main):

✅ **10+ Storybook Stories** in `src/components/stories/`
- All component stories for visual testing
- Interactive documentation
- Isolated development environment

✅ **Admin Designs System**
- UI: `src/app/admin/designs/page.tsx`
- API: `src/app/api/admin/designs/route.ts`
- Full design management interface

✅ **Enhanced Landing Configuration**
- Environment-based landing variants
- Runtime validation
- Plasma Wave Field support

✅ **Production Hotfixes**
- Build error fixes
- Dependency conflict resolutions
- Comment consistency updates
- Various production-specific patches

### Preview Branch Extras (vs Main):

✅ **7-Agent System** (expected in `.github/agents/`)
- Complete team framework
- Distinct agent personalities
- Role-based coordination

✅ **Chromatic Visual Testing**
- CI workflow
- Visual regression detection

✅ **TTS & Voice Improvements**
- Voice redesign
- Audio cutting fixes

✅ **UI Reorganization**
- Layout changes
- Environment updates

⚠️ **Note:** Preview is 356 commits behind main - heavily stale

---

## 🎯 Recommended Actions

### For Production Branch:

1. **Port Storybook to Main**
   - Copy `src/components/stories/` directory
   - Install Storybook dependencies
   - Configure Storybook in main

2. **Port Admin Designs**
   - Copy admin designs page
   - Copy admin designs API
   - Test in main branch

3. **Sync Hotfixes**
   - Review production commits
   - Cherry-pick valuable fixes to main
   - Establish sync policy

### For Preview Branch:

1. **Review Agent System**
   - Determine if still needed
   - Port to main if valuable
   - Or archive preview branch

2. **Update or Archive**
   - Sync preview with main (356 commits behind)
   - Or archive and start fresh

---

**Generated:** 2026-02-17  
**Status:** ✅ Complete with Direct Links  
**Total Files Identified:** 10+ in production, agent system in preview

---

## 🔗 Quick Copy Links

**Production Branch:**
```
https://github.com/thecubiqo/thecubiqo/tree/production
```

**Main Branch:**
```
https://github.com/thecubiqo/thecubiqo/tree/main
```

**Preview Branch:**
```
https://github.com/thecubiqo/thecubiqo/tree/preview
```

**Storybook Stories Folder:**
```
https://github.com/thecubiqo/thecubiqo/tree/production/src/components/stories
```

**Admin Designs Page:**
```
https://github.com/thecubiqo/thecubiqo/blob/production/src/app/admin/designs/page.tsx
```

**Admin Designs API:**
```
https://github.com/thecubiqo/thecubiqo/blob/production/src/app/api/admin/designs/route.ts
```

**Compare Main vs Production:**
```
https://github.com/thecubiqo/thecubiqo/compare/main...production
```

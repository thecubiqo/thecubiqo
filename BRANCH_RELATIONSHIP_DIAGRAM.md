# Branch Relationship Diagram

**Generated:** 2026-02-16

---

## Repository Branch Structure

```
thecubiqo/thecubiqo (62 branches)
│
├─ ACTIVE DEPLOYMENT BRANCHES (4)
│  │
│  ├─ main ........................... 288,921 LOC (primary development)
│  │  ├─ 436 source files
│  │  ├─ Updated: 2026-02-16
│  │  └─ Status: ✅ Healthy
│  │
│  ├─ staging-environment ............ 286,806 LOC (pre-production)
│  │  ├─ 435 source files
│  │  ├─ 23 commits ahead, 35 behind main
│  │  ├─ Updated: 2026-02-16
│  │  └─ Status: ✅ Active
│  │
│  ├─ production ..................... 290,440 LOC ⭐ LARGEST
│  │  ├─ 447 source files (11 more than main)
│  │  ├─ 25 commits ahead, 12 behind main
│  │  ├─ Updated: 2026-02-16
│  │  ├─ Unique: Storybook stories, admin designs, production fixes
│  │  └─ Status: ✅ Active (deployed)
│  │
│  └─ preview ........................ 45,305 LOC (experimental)
│     ├─ 88 source files
│     ├─ 211 commits ahead, 356 behind main
│     ├─ Updated: 2026-02-10
│     ├─ Unique: Agent system (7 agents), TTS improvements
│     └─ Status: ⚠️ Diverged (needs review)
│
├─ FEATURE BRANCHES (50+)
│  │
│  ├─ copilot/compare-backup-with-main ... (current analysis branch)
│  ├─ copilot/fix-audio-chat-issue ........ (merged to main via PR #103)
│  ├─ copilot/fix-sign-in-button-issue .... (merged to main via PR #102)
│  ├─ copilot/update-ui-elements .......... (merged to main via PR #101)
│  ├─ copilot/check-chromatic-connection .. (merged to main via PR #99)
│  ├─ copilot/fix-120k-particle-view ...... (merged to main via PR #98)
│  ├─ copilot/centralize-auth-state ....... (merged to main via PR #89)
│  └─ ... (45+ more copilot/* branches)
│
├─ CONFLICT BRANCHES (3) - Auto-generated
│  ├─ conflict_130226_1721 ................ ⚠️ Can delete
│  ├─ conflict_150226_1305 ................ ⚠️ Can delete
│  └─ conflict_160226_1535 ................ ⚠️ Can delete
│
├─ ARCHIVE BRANCHES (5)
│  ├─ backup-main-20260215-224930 ......... 238,650 LOC (Feb 15 snapshot)
│  ├─ merge-all-features .................. 90,769 LOC (stale, -356 behind)
│  ├─ passedesigns ........................ ~15,000 LOC (design experiments)
│  ├─ master .............................. ~10,000 LOC (legacy)
│  └─ ui/energy-cube-staging .............. (old UI work)
│
└─ OTHER BRANCHES
   ├─ feat/top-right-cta-highdef ......... (feature work)
   ├─ fix/chat-audio-validation ........... (bug fix)
   ├─ visuals-demo ........................ (visual demo)
   └─ test/thecubiqo-main ................. (protected test branch)
```

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                      │
└─────────────────────────────────────────────────────────┘

Feature Branches (copilot/*)
         ↓
    Pull Requests (100 total)
         ↓
    ┌─────────┐
    │  main   │ ← Primary Development (288,921 LOC)
    └────┬────┘
         │
         ↓
┌────────────────────┐
│ staging-environment│ ← Pre-Production Testing (286,806 LOC)
└────────┬───────────┘
         │
         ↓
   ┌────────────┐
   │ production │ ← Deployed (290,440 LOC) ⭐ LARGEST
   └────────────┘

Experimental:
┌─────────┐
│ preview │ ← Long-lived experiments (45,305 LOC)
└─────────┘
    ↑
    └─ May merge valuable features → main
```

---

## Code Size Comparison (Visual)

```
Lines of Code by Branch:

production      ████████████████████████████████ 290,440 ⭐
main            ███████████████████████████████  288,921
staging         ██████████████████████████████   286,806
backup (Feb15)  █████████████████████████        238,650
merge-all       ████████                          90,769
preview         ████                              45,305
passedesigns    █                                 15,000
master          █                                 10,000

Legend:
█ = ~10,000 lines of code
⭐ = Largest branch
```

---

## Branch Health Status

```
Branch                      Health    Last Update   Action
─────────────────────────  ────────  ────────────  ──────────────────
main                       ✅ Excellent  2026-02-16  Continue use
production                 ✅ Excellent  2026-02-16  Keep deploying
staging-environment        ✅ Good       2026-02-16  Keep testing
preview                    ⚠️  Diverged   2026-02-10  Review & sync
backup-main-20260215-*     ✅ Archived   2026-02-15  Keep for history
merge-all-features         ⚠️  Stale      2026-02-12  Archive/delete
conflict_* (3 branches)    🔴 Temporary  2026-02-*   Delete
copilot/* (50+ branches)   ⚠️  Mixed      Various     Audit & cleanup
passedesigns               🔴 Legacy     2026-02-14  Archive/delete
master                     🔴 Obsolete   2026-02-12  Delete
```

---

## PR Distribution

```
Pull Request Status:

Merged PRs (57)     ████████████████████████████ 57%
├─ All in main: ✅
└─ Examples: #103, #102, #101, #100, #99, #98...

Closed (37)         ███████████████████ 37%
├─ Not merged (various reasons)
└─ Superseded, experimental, or abandoned

Open (6)            ███ 6%
└─ In progress

Total: 100 PRs
```

---

## Feature Distribution Map

```
┌────────────────────────────────────────────────────┐
│              FEATURE DISTRIBUTION                   │
└────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════╗
║ main (288,921 LOC)                                ║
║ ─────────────────────────────────────────────     ║
║ ✅ Core application                               ║
║ ✅ 57 merged PRs                                  ║
║ ✅ All authentication                             ║
║ ✅ All API routes                                 ║
║ ✅ All UI components (base)                       ║
║ ✅ Test infrastructure                            ║
║ ✅ CI/CD workflows                                ║
╚═══════════════════════════════════════════════════╝
         ↑
         │ Sync needed
         ↓
╔═══════════════════════════════════════════════════╗
║ production (+1,519 LOC)                           ║
║ ─────────────────────────────────────────────     ║
║ ✅ Everything in main                             ║
║ ➕ 10+ Storybook stories                          ║
║ ➕ Admin designs page                             ║
║ ➕ Enhanced landing config                        ║
║ ➕ Production hotfixes                            ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║ preview (diverged)                                ║
║ ─────────────────────────────────────────────     ║
║ ⚠️  Some features from main                       ║
║ ➕ 7 Agent personalities                          ║
║ ➕ Chromatic workflow                             ║
║ ➕ TTS improvements                               ║
║ ➕ Voice redesign                                 ║
║ ⛔ Missing 356 commits from main                  ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║ staging-environment                               ║
║ ─────────────────────────────────────────────     ║
║ ✅ Most of main                                   ║
║ ➕ Emergency docs                                 ║
║ ➕ PR conflict analysis                           ║
║ ➕ Storybook config                               ║
╚═══════════════════════════════════════════════════╝
```

---

## Timeline View

```
Feb 2026 Branch Activity:

Feb 10 ─┬─ preview updated (last update)
        │
Feb 12 ─┬─ merge-all-features, master updated
        │
Feb 14 ─┬─ passedesigns updated
        │
Feb 15 ─┬─ backup-main-20260215-224930 created ✅
        │  └─ Safety snapshot before changes
        │
Feb 16 ─┬─ main, production, staging updated
        │  ├─ Main restored and enhanced (+229 commits)
        │  ├─ Production hotfixes applied
        │  └─ Staging synchronized
        │
Today  ─┴─ Analysis complete
           └─ 62 branches identified
              100 PRs reviewed
              290,440 LOC in production
```

---

## Unique Features Matrix

| Feature | Main | Production | Staging | Preview |
|---------|------|------------|---------|---------|
| Core App | ✅ | ✅ | ✅ | 🔶 Partial |
| Storybook | ❌ | ✅ | ❌ | ❌ |
| Agent System | ❌ | ❌ | ❌ | ✅ |
| Admin Designs | ❌ | ✅ | ❌ | ❌ |
| Landing Config | ❌ | ✅ | ❌ | ❌ |
| TTS Improvements | ❌ | ❌ | ❌ | ✅ |
| Emergency Docs | ❌ | ❌ | ✅ | ❌ |
| CI/CD | ✅ | ✅ | ✅ | ✅ |
| Up-to-date | ✅ | ✅ | ✅ | ❌ |

Legend:
✅ = Has feature
❌ = Missing feature
🔶 = Partial/outdated

---

## Cleanup Targets

```
SAFE TO DELETE (11 branches):
├─ conflict_130226_1721 ............ (auto-generated)
├─ conflict_150226_1305 ............ (auto-generated)
├─ conflict_160226_1535 ............ (auto-generated)
├─ master .......................... (superseded by main)
└─ copilot/* branches .............. (7+ merged/stale)

REVIEW BEFORE DELETING (5 branches):
├─ merge-all-features .............. (check for unique features)
├─ preview ......................... (port agent system first)
├─ passedesigns .................... (design history)
├─ ui/energy-cube-staging .......... (old UI work)
└─ copilot/* branches .............. (40+ need individual review)

KEEP (7 branches):
├─ main ............................ (primary)
├─ production ...................... (deployed)
├─ staging-environment ............. (testing)
├─ preview ......................... (after porting features)
├─ backup-main-20260215-224930 ..... (history)
├─ test/thecubiqo-main ............. (protected)
└─ copilot/compare-backup-with-main  (current work)
```

---

## Summary Metrics

```
Repository Health: ✅ GOOD

Total Branches:        62
├─ Active:             4 (main, production, staging, preview)
├─ Feature:           50+ (copilot/* pattern)
├─ Conflict:           3 (auto-generated)
└─ Legacy:             5 (archive candidates)

Largest Branch:        production (290,440 LOC)
Primary Branch:        main (288,921 LOC)
Most Diverged:         preview (+211, -356)
Most Stale:            merge-all-features (-356 behind)

PR Coverage:           57/100 merged (57%)
Code in Main:          ✅ All 57 merged PRs present
Unique Features:       3 branches (prod, preview, staging)
Cleanup Candidates:    50+ branches
```

---

**For detailed analysis, see:** MULTI_BRANCH_ANALYSIS.md  
**For quick reference, see:** MULTI_BRANCH_QUICK_REF.md

**Generated:** 2026-02-16  
**Status:** ✅ Analysis Complete

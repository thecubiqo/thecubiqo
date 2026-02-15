# PR Cleanup Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   START: 27 Open PRs                         │
│            "Why are there so many open PRs?"                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  Run Analysis Scripts       │
         │  • analyze-prs.js           │
         │  • pr-cleanup-guide.js      │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────┐
         │  Generated Documentation             │
         │  ✓ PR_CLEANUP_SUMMARY.md             │
         │  ✓ PR_CLEANUP_GUIDE.md               │
         │  ✓ PR_CLEANUP_CHECKLIST.md           │
         │  ✓ PR_CLEANUP_REPORT.md              │
         └──────────┬───────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────┐
    │        Categorize PRs by Priority         │
    └───┬────────────────────────────────────┬──┘
        │                                    │
        ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│  Priority 1: 🔴  │              │  Priority 2: 🟡  │
│  1 PR            │              │  4 PRs           │
│  Already Merged  │              │  Superseded      │
└────┬─────────────┘              └────┬─────────────┘
     │                                 │
     │                                 │
     ▼                                 ▼
     │                      ┌──────────────────┐
     │                      │  Priority 3: 📄  │
     │                      │  1 PR            │
     │                      │  Documentation   │
     │                      └────┬─────────────┘
     │                           │
     │                           │
     │    ┌──────────────────────┘
     │    │
     │    ▼
     │    │              ┌──────────────────┐
     │    │              │  Priority 4: 🔵  │
     │    │              │  8 PRs           │
     │    │              │  Draft PRs       │
     │    │              └────┬─────────────┘
     │    │                   │
     │    │                   │
     │    │    ┌──────────────┘
     │    │    │
     │    │    ▼
     │    │    │         ┌──────────────────┐
     │    │    │         │  Priority 5: ✅  │
     │    │    │         │  13 PRs          │
     │    │    │         │  Ready for Review│
     │    │    │         └────┬─────────────┘
     │    │    │              │
     │    │    │              │
     ▼────▼────▼──────────────▼─────────────────┐
     │                                           │
     │         Manual Review & Action            │
     │         (Via GitHub Web UI)               │
     │                                           │
     │  For each PR:                             │
     │  1. Open PR on GitHub                     │
     │  2. Verify status                         │
     │  3. Close with appropriate comment        │
     │     OR                                    │
     │     Merge if ready                        │
     │     OR                                    │
     │     Request changes                       │
     │                                           │
     └──────────────────┬────────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   Track Progress    │
              │   Using Checklist   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │  Optional: Set up        │
              │  Automation              │
              │  • GitHub Actions        │
              │  • Stale Bot             │
              │  • PR Labels             │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │   ✅ Clean PR List       │
              │   All stale PRs closed   │
              │   Active PRs visible     │
              └──────────────────────────┘
```

## Workflow Explanation

### Phase 1: Analysis (Automated)
- Scripts analyze git history and PR metadata
- Generate categorized reports and guides
- No manual intervention needed

### Phase 2: Categorization (Automated)
PRs are grouped into 5 priorities:
1. **🔴 Priority 1** - Immediate action (already merged)
2. **🟡 Priority 2** - Likely close (superseded)
3. **📄 Priority 3** - Quick review (documentation)
4. **🔵 Priority 4** - Triage (draft PRs)
5. **✅ Priority 5** - Standard review (ready PRs)

### Phase 3: Manual Review (You)
- Work through priorities in order
- Use generated checklist to track progress
- Close/merge/update PRs via GitHub UI

### Phase 4: Prevention (Optional)
- Set up automation to prevent future buildup
- Implement PR lifecycle management
- Use labels and workflows

## Time Estimates

| Priority | PRs | Est. Time | Cumulative |
|----------|-----|-----------|------------|
| P1       | 1   | 1 min     | 1 min      |
| P2       | 4   | 8 min     | 9 min      |
| P3       | 3   | 6 min     | 15 min     |
| P4       | 6   | 15 min    | 30 min     |
| P5       | 13  | 30 min    | 60 min     |
| **Total**| **27** | **~60 min** | **1 hour** |

**Quick cleanup (P1+P2 only): ~10 minutes**

## Key Decision Points

```
For each PR, ask:

┌─────────────────┐
│  Is it merged?  │
└────┬────────────┘
     │
     ├─ Yes → Close immediately
     │
     └─ No → Continue ↓

┌──────────────────────────┐
│  Is it superseded?       │
└────┬─────────────────────┘
     │
     ├─ Yes → Close with reference to replacement
     │
     └─ No → Continue ↓

┌──────────────────────────┐
│  Is it documentation?    │
└────┬─────────────────────┘
     │
     ├─ Yes → Quick review → Merge or close
     │
     └─ No → Continue ↓

┌──────────────────────────┐
│  Is it a draft PR?       │
└────┬─────────────────────┘
     │
     ├─ Yes → Triage → Keep, complete, or close
     │
     └─ No → Continue ↓

┌──────────────────────────┐
│  Standard PR review      │
└──────────────────────────┘
     │
     ├─ Approved → Merge
     ├─ Changes needed → Request changes
     └─ Obsolete → Close
```

## Success Criteria

✅ All merged PRs are closed  
✅ All superseded PRs are closed  
✅ All PRs have clear status  
✅ PR list shows only active work  
✅ Optional: Automation in place to prevent recurrence

---

**Start here:** `START_HERE_PR_CLEANUP.md`

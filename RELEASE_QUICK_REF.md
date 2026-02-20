# Release Process - Quick Reference

**For:** All team members  
**TL;DR:** How to develop, test, and release features safely

---

## 📋 Quick Navigation

- [For Developers (Blossom/Bubbles)](#for-developers-blossombubbles)
- [For QA (Buttercup)](#for-qa-buttercup)
- [For Product (JO)](#for-product-jo)
- [For CTO (MO)](#for-cto-mo)
- [Emergency Hotfix](#emergency-hotfix)

---

## For Developers (Blossom/Bubbles)

### Starting a New Feature

```bash
# 1. Create feature branch from main
git checkout main
git pull
git checkout -b feature/dashboard-ui

# 2. Develop feature
# Write code, commit often

# 3. Test locally
npm run dev
npm run test:run

# 4. Push and create PR
git push origin feature/dashboard-ui
gh pr create --base main --title "Add Dashboard UI" --body "Implements dashboard feature"

# 5. Wait for MO's code review
# 6. Address feedback, push changes
# 7. MO merges to main
```

### Using Feature Flags

```tsx
// For features that need gradual rollout
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyFeature() {
  const { enabled } = useFeatureFlag('my_feature');
  
  if (!enabled) {
    return <ComingSoon />;
  }
  
  return <ActualFeature />;
}
```

### Testing Locally

```bash
# Run all tests
npm run test:run

# Lint code
npm run lint

# Build production bundle
npm run build
```

---

## For QA (Buttercup)

### Testing on Staging

1. **Wait for staging deployment** (auto-deploys from `staging` branch)
2. **Visit:** `staging.cubiqo.ai`
3. **Test feature:** Follow test plan
4. **Report bugs:** Create GitHub issues with label `bug`
5. **Verify fixes:** Test again after developer fixes

### Test Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)
- [ ] Performance (no slowdowns)
- [ ] Edge cases (empty states, errors)

### Reporting Bugs

```markdown
**Bug:** Login button doesn't work

**Steps to Reproduce:**
1. Go to staging.cubiqo.ai/login
2. Click "Login with Email"
3. Nothing happens

**Expected:** Should show email input field
**Actual:** Button does nothing
**Environment:** staging.cubiqo.ai, Chrome 120, macOS

**Screenshot:** [attach screenshot]
```

---

## For Product (JO)

### Planning a Feature

1. **Define requirements:** Write user stories, acceptance criteria
2. **Review with MO:** Discuss technical feasibility
3. **Break into tasks:** Create GitHub issues
4. **Assign to team:** Tag Blossom (backend) or Bubbles (frontend)

### Reviewing on Staging

1. **Check staging:** Visit `staging.cubiqo.ai`
2. **Test feature:** Does it meet requirements?
3. **Approve or request changes:** Comment on PR or GitHub issue
4. **Sign off for production:** Tell MO "ready for release"

### Release Planning (Weekly)

**Every Wednesday:**
- Review what's on staging
- Decide what goes to production on Friday
- Communicate decisions to team

---

## For CTO (MO)

### Daily Workflow

**Morning:**
- [ ] Check PRs awaiting review
- [ ] Review overnight errors (if any)
- [ ] Check CI/CD status

**During Day:**
- [ ] Review code, provide feedback
- [ ] Merge approved PRs to main
- [ ] Unblock developers
- [ ] Architectural decisions

**End of Day:**
- [ ] Ensure main branch is stable
- [ ] Plan next day's priorities

### Weekly Release (Friday 2 PM UTC)

**Wednesday:**
- [ ] Review staging with JO
- [ ] Identify release blockers
- [ ] Create release branch
- [ ] Update CHANGELOG.md

**Thursday:**
- [ ] Final QA on staging
- [ ] Backup production database
- [ ] Notify team of release tomorrow

**Friday 2 PM:**
```bash
# 1. Merge staging to production
git checkout production
git pull
git merge staging --no-ff -m "Release 2025-02-21: Dashboard UI"
git push origin production

# 2. Vercel auto-deploys
# 3. Monitor for 15 minutes
# 4. Run smoke tests
npm run test:visual-smoke -- --env=production

# 5. Notify team
echo "✅ Release successful - cubiqo.ai updated"
```

**Post-Release:**
- [ ] Monitor error rates (24 hours)
- [ ] Check user feedback
- [ ] Prepare hotfix if needed

---

## Emergency Hotfix

**For critical bugs affecting users** (auth broken, payments failing, data loss)

### Process (Fast-Track)

```bash
# 1. Create hotfix branch from production
git checkout production
git pull
git checkout -b hotfix/auth-crash

# 2. Fix the bug (minimal change)
# Write fix, test locally

# 3. Create PR to production
gh pr create --base production --title "HOTFIX: Auth crash on login"

# 4. MO reviews immediately
# 5. Merge to production
git checkout production
git merge hotfix/auth-crash
git push origin production

# 6. Backport to other branches
git checkout staging
git cherry-pick <hotfix-commit-sha>
git push origin staging

git checkout main
git cherry-pick <hotfix-commit-sha>
git push origin main
```

**Communication:**
1. Post in team chat: "🚨 HOTFIX: Deploying auth crash fix"
2. Monitor deployment
3. Verify fix works: Test on cubiqo.ai
4. Post update: "✅ Hotfix deployed, auth working"

---

## Environment URLs

| Environment | URL | Branch | Purpose |
|------------|-----|--------|---------|
| **Development** | `localhost:3000` | `main` | Local dev |
| **Staging** | `staging.cubiqo.ai` | `staging` | Pre-prod testing |
| **Production** | `cubiqo.ai` | `production` | Live users |

---

## Common Commands

### Git

```bash
# Update local branches
git fetch origin
git checkout main && git pull
git checkout staging && git pull
git checkout production && git pull

# Create feature branch
git checkout main
git checkout -b feature/my-feature

# Check which branch you're on
git branch

# View recent commits
git log --oneline -10
```

### Development

```bash
# Install dependencies
npm ci

# Run dev server
npm run dev

# Run tests
npm run test:run

# Lint code
npm run lint

# Build for production
npm run build

# Run production build locally
npm run build && npm run start
```

### Database (Supabase)

```bash
# Create migration
supabase migration new add_my_feature

# Apply migration locally
supabase db reset

# Apply to staging
supabase link --project-ref staging-ref
supabase db push

# Apply to production (after testing!)
supabase link --project-ref prod-ref
supabase db push
```

---

## Feature Flag Management

### Creating a Flag

```sql
-- In Supabase SQL Editor or via Admin UI
INSERT INTO feature_flags (name, enabled, scope, description, config)
VALUES (
  'my_new_feature',
  false,
  'global',
  'New feature description',
  '{"percentage": 0}'
);
```

### Enabling for Internal Users

```sql
UPDATE feature_flags
SET config = '{"user_whitelist": ["mo@cubiqo.ai", "jo@cubiqo.ai"]}'
WHERE name = 'my_new_feature';
```

### Gradual Rollout

```sql
-- 10% of users
UPDATE feature_flags SET config = '{"percentage": 10}' WHERE name = 'my_new_feature';

-- 50% of users
UPDATE feature_flags SET config = '{"percentage": 50}' WHERE name = 'my_new_feature';

-- 100% of users
UPDATE feature_flags SET enabled = true, config = '{"percentage": 100}' WHERE name = 'my_new_feature';
```

### Instant Rollback

```sql
-- Disable feature immediately (no redeploy needed!)
UPDATE feature_flags SET enabled = false WHERE name = 'my_new_feature';
```

---

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions: `https://github.com/thecubiqo/thecubiqo/actions`
2. Look for failed tests or build errors
3. Fix the issue
4. Push fix to branch
5. CI/CD will retry

### Feature Not Showing on Staging

1. Check staging URL: `staging.cubiqo.ai`
2. Clear browser cache (Cmd+Shift+R)
3. Check feature flag is enabled
4. Check browser console for errors
5. Verify deployment succeeded in Vercel

### Database Migration Failed

1. Check Supabase dashboard for errors
2. Review migration SQL for syntax errors
3. Test migration on local database first
4. If stuck, ask Guy (DBA) or MO (CTO)

---

## Questions?

- **Code Issues:** Ask MO (CTO)
- **Product Questions:** Ask JO (Product Owner)
- **Database Questions:** Ask Guy (DBA)
- **Design Questions:** Ask Pushpa (UI/UX)
- **Testing Questions:** Ask Buttercup (QA)

---

**Last Updated:** February 17, 2025  
**Full Documentation:** See `RELEASE_STRATEGY.md`

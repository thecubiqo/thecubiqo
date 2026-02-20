# Staging Database - Quick Reference

> **TL;DR:** Complete guide for setting up and using the CubiQo staging database for testing.

---

## 🚀 Quick Setup (5 Minutes)

### For Project Owners

1. **Create Staging Database**
   ```bash
   # Go to https://supabase.com
   # Create new project: "cubiqo-staging"
   # Copy URL and keys
   ```

2. **Configure Environment**
   ```bash
   # Create .env.staging file
   cp .env.example .env.staging
   
   # Add staging credentials to .env.staging:
   NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-staging.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY_STAGING=your-service-key
   NODE_ENV=staging
   ```

3. **Run Setup Script**
   ```bash
   npm run staging:init      # Verify environment
   npm run staging:migrate   # Apply migrations
   npm run staging:seed      # Add test data (optional)
   npm run staging:verify    # Check health
   ```

4. **Deploy to Vercel**
   ```bash
   # Create staging project on Vercel
   # Add environment variables
   # Deploy from staging branch
   ```

✅ Done! Staging is ready.

---

## 📋 For Testers

### @guy - Database & UX Testing

**Access:** `https://cubiqo-staging.vercel.app`

**Quick Tests:**
```bash
# Test database connection
curl https://cubiqo-staging.vercel.app/api/health?env=staging

# Check feature flags
curl https://cubiqo-staging.vercel.app/api/founderspass/catalog
```

**Focus Areas:**
- Database schema is correct ✓
- Queries are fast (< 50ms) ✓
- User flows work smoothly ✓
- UI is clean and intuitive ✓

**Report:** Create GitHub issues with `staging` label

---

### @Pushpa - QA Testing

**Test Commands:**
```bash
# Functional tests
npm run test:functional -- --env=staging

# Integration tests  
npm run test:integration -- --env=staging

# Performance tests
npm run test:performance -- --env=staging

# Full regression suite
npm run test:regression -- --env=staging
```

**Acceptance Criteria:**
- All tests pass ✓
- No critical bugs ✓
- Performance targets met ✓
- Security audit clean ✓

**Report:** Test results + bug spreadsheet

---

### @mo - Architecture Review

**Review Checklist:**
- [ ] Schema design is normalized
- [ ] APIs follow REST conventions
- [ ] Security practices implemented
- [ ] Performance is acceptable
- [ ] Code quality is high

**Approval:** Comment on PR with `LGTM` or request changes

---

### @jo - Product Validation

**Validation Steps:**
1. Test as end user (non-admin)
2. Verify all features work
3. Check user experience
4. Confirm business logic

**Approval:** Comment on PR with approval or feedback

---

## 🔧 Common Commands

```bash
# Setup & Initialization
npm run staging:init          # Initialize staging environment
npm run staging:migrate       # Run database migrations
npm run staging:seed          # Seed test data
npm run staging:verify        # Verify database health

# Testing
npm run test -- --env=staging # Run all tests on staging
npm run dev                   # Run locally with staging DB

# Maintenance
npm run staging:backup        # Create database backup
npm run staging:reset         # Reset database (⚠️ deletes data)

# Health Check
curl http://localhost:3000/api/health?env=staging
```

---

## 🐛 Issue Reporting

**Template:**
```markdown
Title: [Staging] Brief description

Environment: Staging
URL: https://cubiqo-staging.vercel.app
Severity: [P0/P1/P2/P3]

Steps to Reproduce:
1. ...
2. ...

Expected: ...
Actual: ...

Screenshots: [attach]
```

**Labels:** `staging`, `bug`/`enhancement`, `P0`/`P1`/`P2`/`P3`

---

## 🎯 Success Criteria

### Must Pass
- [ ] Staging database accessible
- [ ] Migrations applied
- [ ] Health check responds
- [ ] Auth works
- [ ] Dashboard loads
- [ ] Feature toggles work
- [ ] Audit logging captures actions

### Performance Targets
- API response: < 200ms (p95)
- DB queries: < 50ms (p95)
- Page load: < 2s

### Sign-Off Required
- [ ] @guy ✓ (Database & UX)
- [ ] @Pushpa ✓ (Testing)
- [ ] @mo ✓ (Architecture)
- [ ] @jo ✓ (Product)

---

## 📚 Full Documentation

- **Complete Setup:** [STAGING_DATABASE_SETUP.md](./STAGING_DATABASE_SETUP.md)
- **Testing Guide:** [STAGING_TESTING_HANDOFF.md](./STAGING_TESTING_HANDOFF.md)
- **Branch Strategy:** [BRANCHES.md](./BRANCHES.md)
- **Feature Flags:** [FEATURE_FLAGS.md](./FEATURE_FLAGS.md)

---

## 🆘 Need Help?

- Database: @guy
- Testing: @Pushpa
- Architecture: @mo
- Product: @jo

**Slack:** #staging-testing  
**GitHub Issues:** Tag with `staging`

---

**Status:** ✅ Ready for Testing  
**Last Updated:** 2026-02-17  
**Version:** 1.0

# Supabase Staging Database Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and managing a Supabase staging database for the CubiQo project. The staging environment is essential for testing new features, performance testing, and regression testing before deploying to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating the Staging Database](#creating-the-staging-database)
3. [Environment Configuration](#environment-configuration)
4. [Migration Process](#migration-process)
5. [Testing Guidelines](#testing-guidelines)
6. [Health Monitoring](#health-monitoring)
7. [Team Workflow](#team-workflow)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the staging database, ensure you have:

- Access to Supabase account with project creation permissions
- Supabase CLI installed (`npm install -g supabase`)
- Node.js 18+ installed
- Access to the CubiQo repository
- Environment variables access in Vercel (for deployment)

## Creating the Staging Database

### Step 1: Create a New Supabase Project

1. Navigate to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Configure the project:
   - **Name:** `cubiqo-staging`
   - **Database Password:** Generate a strong password (save securely)
   - **Region:** Choose the same region as production for consistency
   - **Pricing Plan:** Free tier is sufficient for staging

### Step 2: Get Staging Credentials

Once the project is created:

1. Navigate to **Project Settings → API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Project API keys:**
     - `anon` key (public)
     - `service_role` key (secret - keep secure!)

### Step 3: Configure Local Environment

Create or update `.env.staging` file:

```env
# Staging Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-role-key

# Node Environment
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://cubiqo-staging.vercel.app

# Feature Flags for Staging
NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

## Environment Configuration

### Multi-Environment Support

The application now supports three environments:
- **Development:** Local development with `.env.local`
- **Staging:** Testing environment with `.env.staging`
- **Production:** Live environment with production credentials

### Environment Variable Resolution

Priority order (highest to lowest):
1. Environment-specific variables (e.g., `NEXT_PUBLIC_SUPABASE_URL_STAGING`)
2. Standard variables (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Fallback to default values

### Vercel Configuration

For deploying staging to Vercel:

1. Create a new Vercel project for staging:
   ```bash
   vercel link --project cubiqo-staging
   ```

2. Set environment variables in Vercel dashboard:
   - Go to **Project Settings → Environment Variables**
   - Add staging Supabase credentials
   - Set **NODE_ENV** to `staging`

3. Configure deployment branches:
   - **Production Branch:** `main` (or keep separate)
   - **Preview Branch:** `staging/*` patterns

## Migration Process

### Running Migrations on Staging

#### Option 1: Using Supabase CLI (Recommended)

```bash
# Link to staging project
supabase link --project-ref your-staging-project-ref

# Run all migrations
supabase db push

# Or run specific migration
supabase db push --include-path supabase/migrations/20260216000001_features_catalog.sql
```

#### Option 2: Manual Migration via SQL Editor

1. Navigate to **SQL Editor** in Supabase dashboard
2. Run migrations in order:
   - `20251124000001_initial_schema.sql`
   - `20251126000001_fix_color_constraint.sql`
   - `20251127000001_ensure_profile_function.sql`
   - `20260215000001_add_admin_and_audit.sql`
   - `20260215000001_feature_flags.sql`
   - `20260215000001_founders_pass_schema.sql`
   - `20260215000001_journal_entries.sql`
   - `20260215000001_journey_memory_schema.sql`
   - `20260215000001_self_heal_reports.sql`
   - `20260215000002_cq_system.sql`
   - `20260215000002_journey_helper_functions.sql`
   - `20260216000001_features_catalog.sql`

### Seeding Test Data

Create test data for staging environment:

```bash
# Run the staging seed script
npm run seed:staging
```

This will populate:
- Test user accounts
- Sample feature flags
- Demo journal entries
- Integration configurations

## Testing Guidelines

### Functional Testing

1. **Authentication Flow:**
   - Magic link login
   - Profile creation
   - Session management

2. **Feature Flags:**
   - Toggle features on/off
   - Per-user overrides
   - Design variant selection

3. **Founders Pass:**
   - Dashboard loading
   - Feature catalog display
   - OAuth integrations

### Performance Testing

Use staging for performance benchmarks:

```bash
# Run performance tests
npm run test:performance -- --env=staging

# Load testing
npm run test:load -- --env=staging --users=100
```

### Regression Testing

```bash
# Full regression test suite
npm run test:regression -- --env=staging

# End-to-end tests
npm run test:e2e -- --env=staging
```

## Health Monitoring

### Health Check Endpoint

The staging environment includes a health check endpoint:

**Endpoint:** `GET /api/health?env=staging`

**Response:**
```json
{
  "status": "healthy",
  "environment": "staging",
  "timestamp": "2026-02-17T22:00:00Z",
  "checks": {
    "database": "connected",
    "supabase": "operational",
    "migrations": "up-to-date"
  }
}
```

### Monitoring Dashboard

Access staging health metrics:
- **URL:** `https://your-staging-app.vercel.app/founders-pass/health`
- Shows real-time status of all services
- Auto-refresh every 30 seconds

## Team Workflow

### For @guy (UI/UX & User Journey)

After implementation is complete:

1. Access staging environment: `https://cubiqo-staging.vercel.app`
2. Test user journeys:
   - New user onboarding
   - Feature discovery
   - Visual design variants
3. Provide UI/UX feedback
4. Verify design consistency across components

**Testing Checklist:**
- [ ] Landing page loads correctly
- [ ] Authentication flow is smooth
- [ ] Dashboard is responsive
- [ ] Feature toggles work as expected
- [ ] Visual designs render properly

### For @Pushpa (QA & Testing)

End-to-end functional integration testing:

1. **Functional Tests:**
   ```bash
   npm run test:functional -- --env=staging
   ```

2. **Integration Tests:**
   ```bash
   npm run test:integration -- --env=staging
   ```

3. **Performance Tests:**
   ```bash
   npm run test:performance -- --env=staging
   ```

4. **Regression Tests:**
   ```bash
   npm run test:regression -- --env=staging
   ```

**Testing Scope:**
- [ ] All API endpoints respond correctly
- [ ] Database queries are optimized
- [ ] Feature flags cascade properly
- [ ] OAuth flows complete successfully
- [ ] Error handling works as expected
- [ ] Performance metrics meet targets

### For @mo (Architect) & @jo (Product Owner)

Review and feedback process:

1. **Access Staging:** Use provided credentials
2. **Review Implementation:**
   - Architecture decisions
   - Database schema changes
   - API design patterns
3. **Provide Feedback:** Via GitHub PR comments
4. **Approval:** Mark as approved when satisfactory

**Review Areas:**
- [ ] Schema design is normalized
- [ ] APIs follow REST conventions
- [ ] Security practices are implemented
- [ ] Performance is acceptable
- [ ] Feature requirements are met

### Feedback Loop Protocol

1. **Testing Phase:** @guy and @Pushpa conduct tests
2. **Issue Reporting:** Create GitHub issues with `staging` label
3. **Fix & Deploy:** Developer fixes and deploys to staging
4. **Re-test:** Testers verify fixes
5. **Final Review:** @mo and @jo approve
6. **Production Deploy:** Merge to production branch

## Troubleshooting

### Common Issues

#### 1. Connection Errors

**Problem:** Cannot connect to staging database

**Solution:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL_STAGING

# Test connection
npm run test:db-connection -- --env=staging
```

#### 2. Migration Failures

**Problem:** Migrations fail to apply

**Solution:**
```bash
# Check current migration status
supabase migration list

# Reset database (WARNING: Deletes all data)
supabase db reset

# Reapply migrations
supabase db push
```

#### 3. RLS Policy Errors

**Problem:** Row Level Security blocking requests

**Solution:**
- Check user roles in `profiles` table
- Verify RLS policies in Table Editor
- Test with service role key for admin operations

#### 4. Feature Flags Not Loading

**Problem:** Features catalog not displaying

**Solution:**
```bash
# Verify catalog table exists
npm run verify:catalog -- --env=staging

# Reseed catalog
npm run seed:catalog -- --env=staging
```

### Support Contacts

- **Database Issues:** @guy (DBA)
- **Architecture Questions:** @mo (CTO)
- **Product Clarifications:** @jo (Product Owner)
- **Testing Support:** @Pushpa (QA Lead)

## Security Considerations

### Data Isolation

- Staging data is completely separate from production
- Use anonymized test data (no real user information)
- Reset staging database periodically

### Access Control

- Limit staging access to team members only
- Use Vercel password protection for staging deployments
- Rotate staging credentials every 90 days

### Secrets Management

- Never commit staging credentials to repository
- Store secrets in Vercel environment variables
- Use 1Password or similar for team secret sharing

## Backup and Restore

### Creating Backups

```bash
# Backup staging database
supabase db dump --db-url "$STAGING_DATABASE_URL" > backup.sql
```

### Restoring from Backup

```bash
# Restore staging database
supabase db reset
psql "$STAGING_DATABASE_URL" < backup.sql
```

## Next Steps

1. ✅ Create staging Supabase project
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ✅ Deploy to Vercel staging
5. ⏳ Assign to @guy for UI/UX testing
6. ⏳ @Pushpa conducts comprehensive testing
7. ⏳ @mo and @jo review and approve
8. ⏳ Merge to production

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [CubiQo Branch Structure](./BRANCHES.md)
- [Feature Flags Documentation](./FEATURE_FLAGS.md)

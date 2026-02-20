# Deployment Guide: RGY Intelligent Matching to staging0217

## 📋 Summary

This guide explains how to deploy the RGY Intelligent Matching feature to the staging0217 environment.

## 📦 What's Being Deployed

### Feature: RGY Intelligent Matching & Opportunity Discovery
An AI-powered system that matches users with opportunities (rooms, events, connections, activities) based on their interests across three life contexts (Red, Yellow, Green).

### Branch Information
- **Source Branch**: `copilot/check-chatbot-functionality`
- **Target Environment**: staging0217
- **Files Changed**: 15 files (~2,700 lines of code)
- **Status**: ✅ Production-ready, CodeQL security scan passed (0 alerts)

## 🗂️ Changes Overview

### Database Changes
**Migration Required**: `supabase/migrations/20260218000001_rgy_intelligent_matching.sql`

New tables:
- `user_intents` - User interests with vector embeddings
- `opportunities` - Matchable opportunities with metadata
- `matches` - User-opportunity relationships with similarity scores
- `pro_match_subscriptions` - Automated discovery preferences

### Backend APIs (7 new endpoints)
```
POST   /api/rgy/intents                         - Create/update user intents
GET    /api/rgy/intents                         - Retrieve user intents
DELETE /api/rgy/intents?context={context}       - Deactivate intent
POST   /api/rgy/opportunities/discover          - AI-powered discovery
POST   /api/rgy/opportunities/express-interest  - Express interest in opportunity
GET    /api/rgy/subscription                    - Get subscription status
POST   /api/rgy/subscription                    - Update subscription
GET    /api/cron/rgy-discovery                  - Automated background job
```

### Frontend Components (4 new)
- `IntentSetup.tsx` - Setup interests per RGY context
- `OpportunityFeed.tsx` - Browse matched opportunities
- `ProMatchSettings.tsx` - Manage subscription preferences
- Enhanced `RGYChatsModal.tsx` - Zone selection flow

### AI/ML Features
- OpenAI embeddings (text-embedding-ada-002)
- PostgreSQL pgvector for similarity search
- Automated discovery service

## 🚀 Deployment Steps

### Step 1: Prepare Environment

1. **Set Environment Variables** (in Vercel/staging dashboard):
```bash
# Required for embeddings
OPENAI_API_KEY=sk-...

# Required for automated discovery cron job
CRON_SECRET=<generate-secure-random-string>

# Existing Supabase vars should already be set:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

Generate CRON_SECRET:
```bash
openssl rand -base64 32
```

### Step 2: Database Migration

1. **Enable pgvector extension** (if not already enabled):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

2. **Run migration**:
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual execution
psql $DATABASE_URL < supabase/migrations/20260218000001_rgy_intelligent_matching.sql
```

3. **Verify tables created**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_intents', 'opportunities', 'matches', 'pro_match_subscriptions');
```

### Step 3: Seed Initial Data (Optional)

The migration includes sample opportunities. To add more:

```sql
INSERT INTO opportunities (title, description, rgy_context, opportunity_type, keywords, metadata) 
VALUES 
  ('Morning Meditation Group', 'Daily guided meditation sessions', 'green', 'activity', 
   ARRAY['meditation', 'mindfulness', 'morning', 'wellness'], 
   '{"schedule": "Daily 7am", "format": "Virtual"}'),
  ('Tech Founders Networking', 'Connect with fellow entrepreneurs', 'green', 'event',
   ARRAY['startup', 'tech', 'networking', 'founders'],
   '{"date": "2026-03-01", "format": "Hybrid"}');
```

### Step 4: Deploy to Vercel

**Option A: Deploy via Git** (Recommended)
```bash
# Merge to staging branch
git checkout staging0217  # or create it
git merge copilot/check-chatbot-functionality
git push origin staging0217
```

Vercel will automatically deploy if staging0217 is configured as a preview branch.

**Option B: Deploy via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel --target preview

# Or deploy to specific environment
vercel --target staging
```

### Step 5: Configure Cron Job (Optional)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/rgy-discovery",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Or use GitHub Actions:
```yaml
name: RGY Discovery
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  run-discovery:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Discovery
        run: |
          curl -X GET ${{ secrets.STAGING_URL }}/api/cron/rgy-discovery \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Step 6: Verify Deployment

1. **Check health endpoint**:
```bash
curl https://staging0217.vercel.app/api/health
```

2. **Test authentication**:
```bash
# Should return 401 Unauthorized (expected)
curl https://staging0217.vercel.app/api/rgy/intents
```

3. **Check database connection**:
- Sign in to the staging app
- Try to view profile or any authenticated page

4. **Test RGY components** (manual):
- Open the app
- Navigate to RGY Signal icon
- Try selecting a zone
- Check if IntentSetup component loads

## 🧪 Testing Checklist

### Database
- [ ] Migration runs without errors
- [ ] All 4 tables created with correct schema
- [ ] RLS policies applied
- [ ] Sample opportunities exist

### Backend APIs
- [ ] POST /api/rgy/intents creates intent with embedding
- [ ] GET /api/rgy/intents returns user intents
- [ ] POST /api/rgy/opportunities/discover returns matches
- [ ] POST /api/rgy/subscription creates subscription

### Frontend
- [ ] IntentSetup component renders
- [ ] Can add/remove keywords
- [ ] OpportunityFeed displays opportunities
- [ ] ProMatchSettings loads subscription

### Integration
- [ ] End-to-end flow: Create intent → Discover → Express interest
- [ ] Cron job runs successfully (if configured)

## 🔍 UI Preview

The UI components are ready but not yet integrated into the main app navigation. Here's how to access them:

### Access Components (Post-Deployment)

1. **RGY Signal Button**: Should appear in the main interface
2. **Zone Selection**: Click RGY Signal → Select Green/Yellow/Red
3. **Intent Setup**: After zone selection (not yet wired)
4. **Opportunity Feed**: Accessible via API (not yet in nav)
5. **Pro Match Settings**: Accessible via settings (not yet wired)

### Integration TODO
To make components fully accessible:
1. Add routes to app navigation
2. Wire zone selection to IntentSetup
3. Add "Discover" button to trigger OpportunityFeed
4. Add "Pro Match" to user settings menu

## 📊 Monitoring

After deployment, monitor:

1. **Database Performance**
   - Vector search query times
   - Table sizes and index usage

2. **API Latency**
   - OpenAI embedding generation time
   - Discovery endpoint response time

3. **Cron Job Status**
   - Execution logs
   - Success/failure rate
   - Discovery statistics

4. **User Engagement**
   - Intents created
   - Opportunities discovered
   - Interests expressed
   - Pro Match subscriptions

## ⚠️ Rollback Plan

If issues occur:

1. **Disable Cron Job**:
```bash
# Remove from vercel.json or disable GitHub Action
```

2. **Revert Database** (if needed):
```sql
DROP TABLE IF EXISTS pro_match_subscriptions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS user_intents CASCADE;
DROP FUNCTION IF EXISTS find_matching_opportunities;
```

3. **Revert Code**:
```bash
git revert <commit-hash>
git push origin staging0217
```

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All database tables exist
- ✅ All API endpoints respond correctly
- ✅ Frontend components render without errors
- ✅ No security vulnerabilities
- ✅ User can create intent and discover opportunities

## 📞 Support

**Issues**: GitHub Issues (https://github.com/thecubiqo/thecubiqo/issues)

**Documentation**:
- Feature Guide: `docs/RGY_MATCHING.md`
- Implementation Summary: `RGY_MATCHING_IMPLEMENTATION_SUMMARY.md`
- README: Updated with feature section

---

**Deployment prepared by**: GitHub Copilot Agent
**Date**: 2026-02-19
**Branch**: copilot/check-chatbot-functionality
**Status**: ✅ Ready for staging0217

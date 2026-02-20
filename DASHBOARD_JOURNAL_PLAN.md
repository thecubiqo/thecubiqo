# Dashboard & Journal Features - Implementation Plan

**Author:** MO (CTO)  
**For:** JO (Product Owner), Team  
**Date:** February 17, 2025  
**Status:** Planning Phase

---

## Overview

This document outlines the **technical approach** for implementing the **Dashboard** and **Journal** features using our new three-environment release strategy.

---

## Feature 1: Dashboard

### Requirements (From JO)

**Purpose:** Admin control panel for managing CubiQo

**Core Features:**
- User management (view users, roles, activity)
- Analytics overview (usage stats, popular features)
- System health monitoring (API uptime, error rates)
- Feature flag management (already implemented)
- Settings & configuration

### Technical Architecture

**Frontend (Bubbles):**
- Route: `/admin/dashboard`
- Components:
  - `DashboardLayout` - Main layout with sidebar
  - `UserStatsCard` - User metrics
  - `SystemHealthCard` - API status, errors
  - `AnalyticsChart` - Usage over time (Chart.js or Recharts)
  - `QuickActions` - Common admin tasks

**Backend (Blossom):**
- API Routes:
  - `GET /api/admin/dashboard/stats` - Aggregate statistics
  - `GET /api/admin/users` - User list with pagination
  - `GET /api/admin/analytics` - Time-series analytics data
  - `GET /api/admin/system-health` - Health check status

**Database (Guy):**
- Existing tables:
  - `users` - Already exists
  - `conversations` - Already exists
  - `feature_flags` - Already exists
- New tables (optional):
  - `analytics_events` - Track user actions for dashboard
  - `system_health_logs` - Store health check results

**Migration:**

```sql
-- supabase/migrations/20260217000001_dashboard_tables.sql

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- RLS policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Implementation Plan

**Phase 1: Backend (Blossom) - Week 1**

1. Create API endpoints for stats
2. Write aggregation queries (with Guy)
3. Add authentication checks (admin-only)
4. Write unit tests

**Phase 2: Frontend (Bubbles) - Week 1-2**

1. Create dashboard layout
2. Build stat cards (users, conversations, features)
3. Integrate charts for analytics
4. Add responsive design (mobile-friendly)
5. Work with Pushpa on design polish

**Phase 3: Integration & Testing - Week 2**

1. Connect frontend to backend APIs
2. Test with real data on staging
3. QA testing (Buttercup)
4. Product review (JO)

**Phase 4: Release - Week 3**

1. Merge to main → staging (automatic)
2. Test on staging.cubiqo.ai/admin/dashboard
3. Fix bugs if any
4. Merge staging → production (Friday release)
5. Enable feature flag for admins only

### Feature Flag Strategy

**Flag Name:** `dashboard_ui`

**Rollout Plan:**
1. **Week 1:** Flag OFF in production (code deployed, not visible)
2. **Week 2:** Enable for MO, JO only (`user_whitelist`)
3. **Week 3:** Enable for all admins (`role = admin`)
4. **Week 4:** Remove flag (always on for admins)

**Code:**

```tsx
// src/app/admin/dashboard/page.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useSession } from '@/hooks/useSession';

export default function DashboardPage() {
  const { enabled } = useFeatureFlag('dashboard_ui');
  const { user } = useSession();
  
  if (!user || user.role !== 'admin') {
    return <Redirect to="/unauthorized" />;
  }
  
  if (!enabled) {
    return <ComingSoonPage message="Dashboard coming soon!" />;
  }
  
  return <DashboardUI />;
}
```

---

## Feature 2: Journal

### Requirements (From JO)

**Purpose:** Personal journal for users to reflect, track mood, thoughts

**Core Features:**
- Create journal entries (text, voice transcription)
- View past entries (timeline, calendar view)
- Search entries (full-text search)
- Mood tracking (emoji or scale)
- Privacy controls (entries are private to user)

### Technical Architecture

**Frontend (Bubbles):**
- Route: `/journal`
- Components:
  - `JournalList` - Timeline of entries
  - `JournalEditor` - Rich text editor for new entries
  - `MoodSelector` - Emoji picker for mood
  - `CalendarView` - View entries by date
  - `SearchBar` - Search entries

**Backend (Blossom):**
- API Routes:
  - `GET /api/journal/entries` - List user's entries
  - `POST /api/journal/entries` - Create new entry
  - `GET /api/journal/entries/:id` - Get single entry
  - `PUT /api/journal/entries/:id` - Update entry
  - `DELETE /api/journal/entries/:id` - Delete entry
  - `GET /api/journal/search?q=query` - Search entries

**Database (Guy):**

```sql
-- supabase/migrations/20260224000001_journal_tables.sql

-- Journal entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT, -- 'happy', 'sad', 'neutral', etc.
  tags TEXT[], -- Optional tags for organization
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Full-text search
ALTER TABLE journal_entries ADD COLUMN search_vector tsvector;

CREATE INDEX idx_journal_entries_search 
  ON journal_entries USING gin(search_vector);

-- Update search vector on insert/update
CREATE FUNCTION update_journal_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_search_vector_update
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_search_vector();

-- RLS policies (users can only see their own entries)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON journal_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own entries"
  ON journal_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entries"
  ON journal_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own entries"
  ON journal_entries FOR DELETE
  USING (user_id = auth.uid());
```

### Implementation Plan

**Phase 1: Backend (Blossom) - Week 3**

1. Create journal API endpoints
2. Implement CRUD operations
3. Add search endpoint (full-text search)
4. Write unit tests
5. Secure with authentication

**Phase 2: Database (Guy) - Week 3**

1. Design schema
2. Write migration
3. Test locally
4. Apply to staging
5. Verify RLS policies work

**Phase 3: Frontend (Bubbles) - Week 4**

1. Create journal layout
2. Build editor component (rich text)
3. Build list/timeline view
4. Add search functionality
5. Integrate mood selector
6. Add calendar view (optional)
7. Work with Pushpa on UX polish

**Phase 4: Integration & Testing - Week 5**

1. Connect frontend to backend
2. Test on staging
3. QA testing (Buttercup)
4. Product review (JO)
5. Performance testing (search speed)

**Phase 5: Release - Week 6**

1. Merge to main → staging
2. Test on staging
3. Fix bugs
4. Merge staging → production (Friday)
5. Gradual rollout with feature flag

### Feature Flag Strategy

**Flag Name:** `journal_feature`

**Rollout Plan:**
1. **Week 6:** Flag OFF in production (code deployed, not visible)
2. **Week 7:** Enable for MO, JO only (internal testing)
3. **Week 8:** Enable for 10% of users (A/B test)
4. **Week 9:** Enable for 50% of users
5. **Week 10:** Enable for 100% of users
6. **Week 12:** Remove flag (always on)

**Code:**

```tsx
// src/app/journal/page.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function JournalPage() {
  const { enabled } = useFeatureFlag('journal_feature');
  
  if (!enabled) {
    return <ComingSoonPage message="Journal feature launching soon!" />;
  }
  
  return <JournalUI />;
}
```

---

## Timeline Overview

```
Week 1: Dashboard Backend + Frontend (start)
Week 2: Dashboard Frontend (finish) + Testing
Week 3: Dashboard Release + Journal Backend + DB
Week 4: Journal Frontend (start)
Week 5: Journal Frontend (finish) + Testing
Week 6: Journal Release (flag OFF)
Week 7-10: Journal gradual rollout
Week 12: Both features fully released
```

**Gantt Chart:**

```
Feature       | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12
------------- |----|----|----|----|----|----|----|----|----|-----|-----|-----
Dashboard     | 🔨 | 🔨 | ✅ |    |    |    |    |    |    |     |     |
Journal       |    |    | 🔨 | 🔨 | 🔨 | 🚀 | 🧪 | 🧪 | 🧪 | 🧪  |     | ✅

Legend:
🔨 = Development
🧪 = Testing/Rollout
🚀 = Released (flag OFF)
✅ = Complete
```

---

## Resource Allocation

| Week | Blossom (Backend) | Bubbles (Frontend) | Guy (DBA) | Buttercup (QA) | Pushpa (Design) |
|------|-------------------|--------------------|-----------|----------------|-----------------|
| 1 | Dashboard API | Dashboard UI | Review schema | - | Dashboard design |
| 2 | Dashboard polish | Dashboard polish | - | Dashboard QA | Dashboard polish |
| 3 | Journal API | Dashboard release | Journal schema | Dashboard QA | Journal design |
| 4 | Journal API | Journal UI | Journal migration | - | Journal design |
| 5 | Journal polish | Journal UI | Optimize queries | Journal QA | Journal polish |
| 6 | Journal release | Journal release | Monitor DB | Journal QA | - |
| 7-10 | Monitor metrics | Monitor UX | Monitor queries | Monitor bugs | - |

---

## Risk Management

### Potential Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Dashboard complexity too high** | High | Medium | Start with MVP (basic stats only), iterate |
| **Journal search performance** | Medium | Medium | Use Postgres full-text search, add indexes |
| **Feature flag not working** | High | Low | Already tested, use existing system |
| **Staging environment issues** | Medium | Low | Set up early, test thoroughly |
| **Database migration fails** | High | Low | Test locally, dry-run on staging, backup before production |
| **Timeline slips** | Medium | Medium | Buffer time built in, can descope if needed |

### Mitigation Strategies

1. **MVP First:** Start with core features, add polish later
2. **Feature Flags:** Deploy code early, enable gradually
3. **Testing:** Thorough QA on staging before production
4. **Monitoring:** Watch error rates, performance metrics
5. **Rollback Plan:** Can disable features instantly with flags

---

## Success Metrics

### Dashboard

**Launch Criteria:**
- [ ] All admin users can access dashboard
- [ ] Load time < 2 seconds
- [ ] No errors in error tracking
- [ ] JO approves functionality

**Success Metrics (1 month post-launch):**
- 90%+ admin users use dashboard weekly
- < 1% error rate
- Positive feedback from admin team

### Journal

**Launch Criteria:**
- [ ] Users can create, read, update, delete entries
- [ ] Search works for all entries
- [ ] Mobile responsive
- [ ] Privacy enforced (RLS)
- [ ] JO approves UX

**Success Metrics (1 month post-launch):**
- 20%+ of users create at least one journal entry
- 10%+ of users use journal weekly
- Average 3+ entries per active journal user
- < 2% error rate
- 4+ star rating in user feedback

---

## Next Steps

### Immediate (This Week)

1. **MO:** Approve this plan
2. **JO:** Review requirements, provide feedback
3. **Guy:** Review database schema, suggest optimizations
4. **Blossom:** Start dashboard API (if approved)
5. **Bubbles:** Start dashboard UI mockup
6. **Buttercup:** Prepare test plans for dashboard
7. **Pushpa:** Create dashboard design mockups

### Next Week

1. **MO:** Implement staging environment (RELEASE_SETUP_CHECKLIST.md)
2. **Team:** Continue dashboard development
3. **Weekly Sync:** Review progress, adjust plan if needed

---

## Questions & Answers

**Q: Can we do both features in parallel?**  
A: Not recommended. Dashboard first (simpler), then journal. Avoids overwhelming the team.

**Q: What if timeline slips?**  
A: Descope features (start with MVP), or extend timeline. Feature flags let us deploy code early.

**Q: How do we handle user feedback?**  
A: Use feature flags for gradual rollout. Monitor metrics, gather feedback, iterate.

**Q: What about mobile apps?**  
A: These features are web-first. Mobile apps can use same APIs later.

**Q: Do we need design mockups before coding?**  
A: Yes, Pushpa should create mockups for Bubbles to implement. Prevents rework.

---

## Approval

- [ ] **MO (CTO):** Technical approach approved
- [ ] **JO (Product Owner):** Requirements approved
- [ ] **Team:** Acknowledged and ready to start

**Sign-off:**
- MO: _________________ Date: _______
- JO: _________________ Date: _______

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2025  
**Next Review:** February 24, 2025 (after Week 1 progress)

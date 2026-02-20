# Sprint 1 Database Entity Relationship Diagram (ERD)

## Visual Schema Representation

```
                                    ┌─────────────────────────────────────┐
                                    │         auth.users                  │
                                    │      (Supabase Built-in)            │
                                    │─────────────────────────────────────│
                                    │  id (PK) UUID                       │
                                    │  email                              │
                                    │  created_at                         │
                                    └──────────────┬──────────────────────┘
                                                   │
                                                   │ user_id (FK)
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     │                             │                             │
                     ▼                             ▼                             ▼
     ┌──────────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
     │   browser_sessions           │  │   browser_actions        │  │  browser_consent_records │
     │──────────────────────────────│  │──────────────────────────│  │──────────────────────────│
     │  id (PK)                     │◄─┤  session_id (FK)         │◄─┤  session_id (FK)         │
     │  user_id (FK) ───────────────┼──┤  user_id (FK)            │  │  user_id (FK)            │
     │  url                         │  │  id (PK)                 │  │  id (PK)                 │
     │  purpose                     │  │  action_type             │  │  domain                  │
     │  status                      │  │  target                  │  │  action_description      │
     │  consent_given               │  │  result                  │  │  approved                │
     │  consent_at                  │  │  success                 │  │  reason                  │
     │  created_at                  │  │  error                   │  │  remember_choice         │
     │  completed_at                │  │  screenshot_url          │  │  created_at              │
     │  metadata (JSONB)            │  │  created_at              │  └──────────────────────────┘
     └──────────────────────────────┘  │  metadata (JSONB)        │
                                        └──────────────────────────┘
```

## Table Relationships

### 1. **auth.users → browser_sessions** (One-to-Many)
- **Relationship**: One user can have many browser sessions
- **Foreign Key**: `browser_sessions.user_id → auth.users.id`
- **Cascade**: ON DELETE CASCADE (delete user → delete all their sessions)

### 2. **auth.users → browser_actions** (One-to-Many)
- **Relationship**: One user can perform many browser actions
- **Foreign Key**: `browser_actions.user_id → auth.users.id`
- **Cascade**: ON DELETE CASCADE (delete user → delete all their actions)

### 3. **browser_sessions → browser_actions** (One-to-Many)
- **Relationship**: One session can have many actions
- **Foreign Key**: `browser_actions.session_id → browser_sessions.id`
- **Cascade**: ON DELETE CASCADE (delete session → delete all its actions)

### 4. **auth.users → browser_consent_records** (One-to-Many)
- **Relationship**: One user can have many consent records
- **Foreign Key**: `browser_consent_records.user_id → auth.users.id`
- **Cascade**: ON DELETE CASCADE (delete user → delete all their consents)

### 5. **browser_sessions → browser_consent_records** (One-to-Many)
- **Relationship**: One session can have many consent records
- **Foreign Key**: `browser_consent_records.session_id → browser_sessions.id`
- **Cascade**: ON DELETE CASCADE (delete session → delete all its consents)

---

## Index Strategy Visualization

### browser_sessions (3 indexes)
```
user_id        ──►  idx_browser_sessions_user
   │
   └──► Fast user session lookups (WHERE user_id = ?)

status         ──►  idx_browser_sessions_status
   │
   └──► Fast status filtering (WHERE status = 'active')

created_at     ──►  idx_browser_sessions_created_at (DESC)
   │
   └──► Fast sorting by time (ORDER BY created_at DESC)
```

### browser_actions (4 indexes)
```
session_id     ──►  idx_browser_actions_session
   │
   └──► Fast session action lookup (WHERE session_id = ?)

user_id        ──►  idx_browser_actions_user
   │
   └──► Fast user action lookup (WHERE user_id = ?)

created_at     ──►  idx_browser_actions_created_at (DESC)
   │
   └──► Fast time-based sorting (ORDER BY created_at)

success        ──►  idx_browser_actions_success
   │
   └──► Fast filtering by result (WHERE success = FALSE)
```

### browser_consent_records (5 indexes)
```
user_id        ──►  idx_consent_user
   │
   └──► Fast user consent lookup (WHERE user_id = ?)

domain         ──►  idx_consent_domain
   │
   └──► Fast domain lookup (WHERE domain = ?)

session_id     ──►  idx_consent_session
   │
   └──► Fast session consent lookup (WHERE session_id = ?)

(user_id, domain) ──►  idx_consent_user_domain (COMPOSITE)
   │
   └──► Super fast user+domain lookup (WHERE user_id = ? AND domain = ?)

created_at     ──►  idx_consent_created_at (DESC)
   │
   └──► Fast time-based sorting (ORDER BY created_at)
```

---

## Query Flow Examples

### Example 1: User starts browser session
```
User Request
    │
    ▼
┌──────────────────────┐
│ INSERT INTO          │
│ browser_sessions     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Check RLS:           │
│ user_id = auth.uid() │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Session created      │
│ Return session.id    │
└──────────────────────┘
```

### Example 2: Log browser action
```
Browser Action
    │
    ▼
┌──────────────────────┐
│ INSERT INTO          │
│ browser_actions      │
│ (session_id,         │
│  action_type,        │
│  success)            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Check FK:            │
│ session_id exists?   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Check RLS:           │
│ user_id = auth.uid() │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Action logged        │
└──────────────────────┘
```

### Example 3: Check consent for domain
```
User visits domain
    │
    ▼
┌──────────────────────────────┐
│ CALL                         │
│ get_user_domain_consent(     │
│   auth.uid(),                │
│   'example.com'              │
│ )                            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Query:                       │
│ SELECT * FROM                │
│ browser_consent_records      │
│ WHERE user_id = ?            │
│   AND domain = ?             │
│   AND remember_choice = TRUE │
│ ORDER BY created_at DESC     │
│ LIMIT 1                      │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Uses composite index:        │
│ idx_consent_user_domain      │
│ (fast lookup)                │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Return:                      │
│ - approved (BOOLEAN)         │
│ - remember_choice (BOOLEAN)  │
│ - created_at (TIMESTAMPTZ)   │
└──────────────────────────────┘
```

### Example 4: User deletes their account
```
DELETE user
    │
    ▼
┌──────────────────────────────┐
│ Cascade to:                  │
│ - browser_sessions           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Cascade to:                  │
│ - browser_actions            │
│ - browser_consent_records    │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ All user data deleted        │
│ (data privacy compliance)    │
└──────────────────────────────┘
```

---

## RLS Policy Flow

### SELECT Policy (View Own Data)
```
User Query:
SELECT * FROM browser_sessions WHERE status = 'active'

    │
    ▼
┌─────────────────────────────┐
│ PostgreSQL RLS Check:       │
│                             │
│ POLICY "Users can view own  │
│ sessions"                   │
│                             │
│ USING (auth.uid() = user_id)│
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Rewritten Query:            │
│                             │
│ SELECT * FROM               │
│ browser_sessions            │
│ WHERE status = 'active'     │
│   AND user_id = auth.uid()  │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Uses index:                 │
│ idx_browser_sessions_user   │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Return only user's sessions │
└─────────────────────────────┘
```

### INSERT Policy (Create Own Data)
```
User Insert:
INSERT INTO browser_sessions (user_id, url, status)
VALUES (auth.uid(), 'https://...', 'pending')

    │
    ▼
┌─────────────────────────────┐
│ PostgreSQL RLS Check:       │
│                             │
│ POLICY "Users can create    │
│ own sessions"               │
│                             │
│ WITH CHECK (                │
│   auth.uid() = user_id      │
│ )                           │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Verify:                     │
│ auth.uid() = NEW.user_id    │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Insert allowed ✅           │
│ (user can only insert       │
│  their own records)         │
└─────────────────────────────┘
```

---

## Data Flow Timeline

```
Time →

T0: User authenticates
    │
    └──► auth.users record exists (auth.uid() available)

T1: User requests browser automation
    │
    └──► INSERT browser_sessions (status = 'pending')

T2: System asks for consent
    │
    └──► Check: get_user_domain_consent(user_id, domain)

T3: User approves consent
    │
    └──► INSERT browser_consent_records (approved = true)

T4: Session starts
    │
    └──► UPDATE browser_sessions (status = 'active')

T5: Action: Navigate to URL
    │
    └──► INSERT browser_actions (action_type = 'navigate', success = true)

T6: Action: Click button
    │
    └──► INSERT browser_actions (action_type = 'click', success = true)

T7: Action: Screenshot
    │
    └──► INSERT browser_actions (action_type = 'screenshot', success = true)

T8: Session completes
    │
    └──► UPDATE browser_sessions (status = 'completed', completed_at = NOW())

T9: User views history
    │
    └──► SELECT * FROM browser_sessions WHERE user_id = auth.uid()
    └──► SELECT * FROM browser_actions WHERE session_id IN (...)
```

---

## Security Architecture

### Defense in Depth (3 Layers)

**Layer 1: Authentication**
```
Supabase Auth (JWT)
    │
    ├──► Verifies user identity
    └──► Provides auth.uid() for RLS
```

**Layer 2: Row Level Security (RLS)**
```
PostgreSQL RLS Policies
    │
    ├──► Enforces user_id = auth.uid()
    ├──► Prevents cross-user data access
    └──► Applied at database level (can't bypass)
```

**Layer 3: Application Logic**
```
Application Code (Blossom)
    │
    ├──► Additional validation
    ├──► Business rules
    └──► Rate limiting
```

---

## Performance Characteristics

### Fast Operations (< 5ms)
- ✅ Get user's sessions (indexed on user_id)
- ✅ Check consent for domain (composite index)
- ✅ Insert new action (simple insert)
- ✅ Get session by ID (primary key lookup)

### Medium Operations (5-10ms)
- ⚡ Get all actions for session (indexed join)
- ⚡ Filter by status (indexed filter)
- ⚡ Sort by created_at (indexed sort)

### Potentially Slow Operations (needs monitoring)
- ⚠️ Full-text search on metadata JSONB
- ⚠️ Large result sets without pagination
- ⚠️ Complex aggregations across all tables

---

**Created by:** GUY (Database Administrator)  
**Date:** 2026-02-17  
**For:** Sprint 1 - Browser Automation Feature

# CubiQo Implementation Plan
**Date:** 2026-02-07
**Status:** In Progress - Completing ALL Requirements

## Phase 1: P1 Critical Features (This Week)

### 1. Verbal Commands & OAuth Integration ✨ **NEW**
**Priority:** P1 (Highest)
**Status:** Not Started
**Estimated:** 8-12 hours

#### Tasks:
- [ ] Set up OAuth providers (Google, Twitter/X, WhatsApp Business API)
- [ ] Create OAuth flow in Next.js API routes
- [ ] Implement email commands (send, read, search)
  - Gmail API integration
  - Voice command parsing: "Send email to [contact] about [subject]"
  - Read recent emails with voice output
- [ ] Implement Twitter/X commands (post, reply, DM)
  - X API v2 integration
  - "Post on Twitter: [content]"
  - "Reply to [user]: [message]"
- [ ] Implement Maps commands
  - Google Maps API
  - "Navigate to [location]"
  - "Find [type] near me"
- [ ] Implement Uber booking (via headless browser)
  - Puppeteer automation for Uber.com
  - "Book Uber to [destination]"
  - Price estimation
- [ ] Implement WhatsApp messaging (via WhatsApp Business API or headless)
  - "Send WhatsApp to [contact]: [message]"

**Files to Create:**
- `src/lib/oauth/google.ts` - Google OAuth + Gmail
- `src/lib/oauth/twitter.ts` - X/Twitter OAuth + API
- `src/lib/oauth/whatsapp.ts` - WhatsApp Business API
- `src/lib/commands/email.ts` - Email command handlers
- `src/lib/commands/social.ts` - Social media handlers
- `src/lib/commands/location.ts` - Maps/Uber handlers
- `src/app/api/oauth/[provider]/route.ts` - OAuth callbacks
- `src/app/api/commands/execute/route.ts` - Command execution endpoint

### 2. Daily Journal (Rozana) System ✨ **NEW**
**Priority:** P2
**Status:** Not Started
**Estimated:** 6-8 hours

#### Features:
- Voice/text journal entries with RGY categorization
- Auto-save entries to Supabase
- Calendar view with color-coded days
- Timeline view of entries
- Search/filter by date, color, keywords
- Export to PDF/Markdown

**Database Schema:**
```sql
create table journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  entry_date date not null,
  entry_time timestamp with time zone not null,
  entry_type text not null check (entry_type in ('voice', 'text')),
  content text not null,
  color_category text not null check (color_category in ('RED', 'YELLOW', 'GREEN_BLUE')),
  mood text,
  keywords text[],
  audio_url text,
  word_count int,
  created_at timestamp with time zone default now()
);

create index idx_journal_user_date on journal_entries(user_id, entry_date desc);
```

**Files to Create:**
- `src/app/journal/page.tsx` - Journal UI
- `src/components/journal/JournalCalendar.tsx`
- `src/components/journal/JournalTimeline.tsx`
- `src/components/journal/JournalEntry.tsx`
- `src/hooks/useJournal.ts`
- `src/lib/journal/service.ts`
- `src/app/api/journal/route.ts`

### 3. Conscious Mind Memory System ✨ **NEW**
**Priority:** P2
**Status:** Partially implemented (extraction exists, storage missing)
**Estimated:** 4-6 hours

#### Tasks:
- [ ] Integrate memory extraction into chat flow
- [ ] Store extracted memories in Supabase
- [ ] Retrieve relevant memories during conversations
- [ ] Memory management UI (view, edit, delete memories)
- [ ] Memory search and filtering

**Database Schema:**
```sql
create table user_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  memory_type text not null check (memory_type in ('fact', 'preference', 'relationship', 'context', 'goal')),
  content text not null,
  confidence_score float,
  source_message_id uuid,
  extracted_at timestamp with time zone default now(),
  last_referenced timestamp with time zone,
  reference_count int default 0,
  is_active boolean default true
);

create index idx_memories_user on user_memories(user_id, is_active);
```

**Files to Update/Create:**
- `src/lib/ai/memory-storage.ts` - NEW: Memory persistence
- `src/lib/ai/memory-retrieval.ts` - NEW: Context-aware retrieval
- `src/app/api/memories/route.ts` - NEW: Memory CRUD API
- `src/app/memories/page.tsx` - NEW: Memory management UI
- Update `src/lib/ai/service.ts` to use memories in context

## Phase 2: P1 UI & Settings (Next 2-3 Days)

### 4. Settings Cube Interactive System
**Priority:** P1
**Status:** Partially implemented (UI exists, functionality missing)
**Estimated:** 4-6 hours

#### Tasks:
- [ ] Wire Settings Cube commands to actual settings storage
- [ ] Implement color/voice preference persistence
- [ ] Add explanatory responses for each setting
- [ ] Voice command integration for settings
- [ ] Settings sync across devices (Supabase)

**Files to Update:**
- `src/components/settings-cube/SettingsCubeApp.tsx` - Add backend integration
- `src/lib/settings/service.ts` - NEW: Settings persistence
- `src/app/api/settings/route.ts` - NEW: Settings API

### 5. Side Panel Enhancement
**Priority:** P1
**Status:** Implemented (Keywords panel exists)
**Estimated:** 2 hours

#### Tasks:
- [x] Keywords per color zone ✓ (Already done)
- [x] Disclaimers visible ✓ (Already done)
- [ ] Make keywords editable
- [ ] Sync keywords with backend

## Phase 3: P2 Core Features (Next Week)

### 6. CQ-to-CQ Direct Messaging System
**Priority:** P3 (but important for social features)
**Status:** Not Started
**Estimated:** 12-16 hours

#### Features:
- CQ number generation (random, time-bound)
- Friend request system (BBM PIN-style)
- Direct messaging (text, voice, video)
- Voice message transcription
- CubiQo reads received messages in its voice
- Block/remove friends
- Privacy controls

**Database Schema:**
```sql
create table cq_numbers (
  user_id uuid primary key references auth.users,
  cq_number text unique not null,
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  is_active boolean default true
);

create table cq_friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(requester_id, receiver_id)
);

create table cq_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  message_type text not null check (message_type in ('text', 'voice', 'video')),
  content text,
  media_url text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index idx_messages_receiver on cq_messages(receiver_id, created_at desc);
```

### 7. Analytics Integration
**Priority:** P2-P4
**Status:** Not Started
**Estimated:** 4-6 hours

#### Tasks:
- [ ] Google Analytics 4 integration
- [ ] Track color switches, session duration, voice vs text usage
- [ ] Custom events for key interactions
- [ ] Privacy-compliant tracking (no PII)
- [ ] Analytics dashboard for admins

## Phase 4: Additional Features

### 8. Email Integration (Built into CAP API Layer)
**Priority:** P2
**Status:** Not Started (part of OAuth/commands)

### 9. Web Portal/Generator
**Priority:** P1 (from requirements)
**Status:** Not Started
**Estimated:** 16-20 hours
**Note:** This is a separate product - website/subdomain generator with templates

### 10. RGY Chat Rooms (Match System)
**Priority:** P3-P4
**Status:** UI created, functionality missing
**Estimated:** 20-30 hours

#### Features:
- Proactive matching based on capsules [COLOR | INTENT | KEYWORDS]
- Geo-fenced rooms when relevant
- Different view modes (list, cards, map pins)
- Chat room lifecycle management
- Privacy via staged disclosure

## Migration Files Needed

```sql
-- Run in order:
-- 1. Journal entries table
-- 2. User memories table  
-- 3. CQ numbers and friendships
-- 4. CQ messages
-- 5. Settings storage
-- 6. Analytics events
```

## Deployment Checklist

- [ ] OAuth credentials configured (Google, Twitter, WhatsApp)
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] API rate limits configured
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Service worker updated
- [ ] PWA manifest updated

## Notes

- Focus on P1 features first - verbal commands, journal, memory
- Use existing OAuth + headless browser infrastructure
- Leverage Supabase for all data persistence
- Keep UI consistent with existing design
- Test voice commands thoroughly across browsers
- Maintain privacy-first approach (user consent for all external actions)

## Time Estimates

- **Phase 1 (P1 Critical):** 18-26 hours (~2-3 days)
- **Phase 2 (P1 UI):** 6-8 hours (~1 day)
- **Phase 3 (P2 Core):** 16-22 hours (~2-3 days)
- **Total for MVP completion:** ~40-56 hours (~1 week intensive work)

**Target Completion:** February 14, 2026 (1 week from today)

---

## Current Status (Live Tracking)

**Last Updated:** 2026-02-07 12:30 PM EST
**Completed:** 0/10 major features
**In Progress:** Starting Phase 1
**Next Up:** OAuth integration + verbal commands

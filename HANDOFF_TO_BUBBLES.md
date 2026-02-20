# 🎯 Handoff: Journal History API → Frontend Integration

**From**: Blossom (Backend Dev)  
**To**: Bubbles (Frontend Dev)  
**Date**: 2026-02-18  
**Status**: ✅ Backend Ready for Integration

---

## 📦 What's Ready

I've completed the backend API for journal history. The endpoint is **production-ready** and fully tested.

### API Endpoint
```
GET /api/journal/history
```

### Files Created
1. **API Route**: `src/app/api/journal/history/route.ts`
2. **Tests**: `tests/api/journal/history.test.ts` (20+ test cases)
3. **Docs**: `docs/api/journal-history.md` (full API reference)
4. **Summary**: `JOURNAL_HISTORY_API_SUMMARY.md` (implementation details)

---

## 🚀 Quick Start (Frontend Integration)

### Basic Usage
```typescript
// Fetch journal history
async function fetchJournalHistory() {
  const response = await fetch('/api/journal/history');
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      router.push('/login');
      return;
    }
    throw new Error('Failed to load journal history');
  }
  
  const data = await response.json();
  return data;
}
```

### Response Structure
```typescript
interface JournalHistoryResponse {
  success: boolean;
  entries: JournalEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    returned: number;
  };
  userId: string;
}

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  color_state: string;
  word_count: number;
  duration_seconds: number;
  created_at: string;
}
```

### With Pagination
```typescript
// Load more entries
async function loadMore(page: number) {
  const limit = 30;
  const offset = page * limit;
  
  const response = await fetch(
    `/api/journal/history?limit=${limit}&offset=${offset}`
  );
  
  return await response.json();
}
```

### With Search
```typescript
// Search journal entries
async function searchJournal(query: string) {
  const response = await fetch(
    `/api/journal/history?search=${encodeURIComponent(query)}`
  );
  
  return await response.json();
}
```

---

## 🎨 UI Implementation Guide

### Recommended Components

#### 1. Journal History Page
**Location**: `src/app/journal/history/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function JournalHistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [page]);

  async function loadEntries() {
    try {
      setLoading(true);
      const response = await fetch(`/api/journal/history?limit=30&offset=${page * 30}`);
      
      if (!response.ok) {
        throw new Error('Failed to load entries');
      }
      
      const data = await response.json();
      
      if (page === 0) {
        setEntries(data.entries);
      } else {
        setEntries(prev => [...prev, ...data.entries]);
      }
      
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="journal-history">
      <h1>My Journal History</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="entries">
        {entries.map(entry => (
          <JournalEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
      
      {hasMore && (
        <button onClick={() => setPage(p => p + 1)} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

#### 2. Journal Entry Card Component
**Location**: `src/components/journal/JournalEntryCard.tsx`

```typescript
interface JournalEntryCardProps {
  entry: {
    id: string;
    content: string;
    mood: string;
    word_count: number;
    duration_seconds: number;
    created_at: string;
  };
}

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const date = new Date(entry.created_at);
  const durationMinutes = Math.floor(entry.duration_seconds / 60);

  return (
    <div className="journal-entry-card">
      <div className="entry-header">
        <time>{date.toLocaleDateString()}</time>
        <span className={`mood mood-${entry.mood}`}>{entry.mood}</span>
      </div>
      
      <p className="entry-content">{entry.content}</p>
      
      <div className="entry-meta">
        <span>{entry.word_count} words</span>
        <span>{durationMinutes} min</span>
      </div>
    </div>
  );
}
```

#### 3. Search Component (Optional)
**Location**: `src/components/journal/JournalSearch.tsx`

```typescript
'use client';

import { useState } from 'react';

export function JournalSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  return (
    <form onSubmit={handleSubmit} className="journal-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your journal..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

---

## 📋 Frontend Tasks Checklist

### Phase 1: Basic Display
- [ ] Create `/journal/history` page
- [ ] Fetch and display journal entries
- [ ] Show loading state
- [ ] Handle error states (401, 500)
- [ ] Format dates nicely
- [ ] Show mood with colors/icons

### Phase 2: Pagination
- [ ] Implement "Load More" button
- [ ] OR implement infinite scroll
- [ ] Show loading indicator while fetching
- [ ] Disable button when no more entries
- [ ] Handle edge case: no entries at all

### Phase 3: Search (Optional for MVP)
- [ ] Add search input
- [ ] Debounce search input (500ms)
- [ ] Show search results
- [ ] Clear search / reset to full list
- [ ] Show "No results" state

### Phase 4: Polish
- [ ] Add entry card animations
- [ ] Add skeleton loaders
- [ ] Make responsive (mobile-friendly)
- [ ] Add empty state illustration
- [ ] Test with different data sizes

---

## 🎯 API Parameters Reference

### Query Parameters
| Parameter | Type   | Default | Max | Description                    |
|-----------|--------|---------|-----|--------------------------------|
| `limit`   | number | 30      | 100 | Entries per page               |
| `offset`  | number | 0       | -   | Starting position (0-indexed)  |
| `search`  | string | -       | -   | Text to search in content      |

### Examples
```
# Get first page (default)
/api/journal/history

# Get 10 entries
/api/journal/history?limit=10

# Get second page (entries 30-59)
/api/journal/history?offset=30

# Search for "grateful"
/api/journal/history?search=grateful

# Combined: search with custom limit
/api/journal/history?search=grateful&limit=50
```

---

## 🔒 Authentication

### How It Works
- API requires Supabase authentication
- Uses session cookies automatically
- Returns `401` if user not logged in

### Frontend Handling
```typescript
async function fetchWithAuth() {
  const response = await fetch('/api/journal/history');
  
  if (response.status === 401) {
    // User not authenticated
    // Redirect to login
    router.push('/login');
    return;
  }
  
  if (!response.ok) {
    // Other error
    throw new Error('Failed to fetch');
  }
  
  return await response.json();
}
```

---

## 🎨 Design Recommendations

### Entry Card Layout
```
┌─────────────────────────────────────┐
│ 📅 Feb 15, 2026    😊 Positive      │
│                                     │
│ Today I reflected on my journey... │
│ Lorem ipsum dolor sit amet...      │
│                                     │
│ 125 words • 7 min                   │
└─────────────────────────────────────┘
```

### Mood Colors (Suggestion)
- **Positive**: Green (#10B981)
- **Neutral**: Gray (#6B7280)
- **Reflective**: Blue (#3B82F6)
- **Challenged**: Orange (#F59E0B)

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│         📔                          │
│                                     │
│    No journal entries yet           │
│                                     │
│    Start your journaling journey    │
│    [Start Writing]                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### Test Scenarios
1. **Empty state**: New user with no entries
2. **Single entry**: User with 1 entry
3. **Full page**: User with 30+ entries
4. **Pagination**: Load more entries
5. **Search**: Search and get results
6. **No search results**: Search with no matches
7. **Authentication**: Logged out user
8. **Error handling**: API errors

### Manual Testing
```bash
# Test with authenticated user
# 1. Log in to the app
# 2. Navigate to /journal/history
# 3. Verify entries display
# 4. Click "Load More" (if >30 entries)
# 5. Try search functionality

# Test without authentication
# 1. Log out
# 2. Navigate to /journal/history
# 3. Should redirect to login
```

---

## 📞 Communication

### Questions for Me (Blossom)
- API not working? Check console for errors
- Need different fields? Let me know
- Performance issues? I can optimize
- Want different sort order? Easy to add

### Coordinate with Others
- **Buttercup (QA)**: She'll test your UI + API integration
- **Pushpa (UI/UX)**: She can design the entry cards
- **MO (CTO)**: He'll review the full feature

---

## 📚 Documentation

### For More Details
1. **API Docs**: `docs/api/journal-history.md` (full reference)
2. **Implementation Summary**: `JOURNAL_HISTORY_API_SUMMARY.md`
3. **Database Schema**: `supabase/migrations/20260215000001_journal_entries.sql`

### Example Responses
See `docs/api/journal-history.md` for complete examples of:
- Success responses
- Error responses
- Edge cases

---

## ✅ Ready to Go!

The backend is **100% ready**. You can start building the UI immediately.

### Next Steps
1. Create the journal history page
2. Test with the API locally
3. Build the entry card component
4. Add pagination
5. Coordinate with me for any adjustments

---

**Questions?** Ping me anytime! I'm here to help.

— Blossom 💗

*P.S. The API is fully tested, secure, and performant. Happy coding!*

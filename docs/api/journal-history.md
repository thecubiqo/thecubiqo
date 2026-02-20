# Journal History API Documentation

## Endpoint: `/api/journal/history`

### Overview
Fetches journal entries for authenticated users with support for pagination and text search.

### Authentication
- **Required**: Yes
- **Type**: Supabase Auth (JWT token in cookies)
- **Response on failure**: `401 Unauthorized`

---

## GET Request

### Description
Retrieves journal entries for the currently authenticated user.

### URL
```
GET /api/journal/history
```

### Query Parameters

| Parameter | Type   | Required | Default | Max   | Description                                      |
|-----------|--------|----------|---------|-------|--------------------------------------------------|
| `limit`   | number | No       | 30      | 100   | Number of entries to return per page             |
| `offset`  | number | No       | 0       | -     | Starting position for pagination (0-indexed)     |
| `search`  | string | No       | -       | -     | Text to search for in journal entry content      |

### Examples

#### Basic request (default pagination)
```bash
GET /api/journal/history
```

#### Custom pagination
```bash
GET /api/journal/history?limit=10&offset=20
```

#### Search with pagination
```bash
GET /api/journal/history?search=grateful&limit=50
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Today I reflected on...",
      "mood": "positive",
      "color_state": "ORANGE",
      "word_count": 125,
      "duration_seconds": 420,
      "created_at": "2026-02-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 30,
    "offset": 0,
    "hasMore": true,
    "returned": 30
  },
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Field Descriptions

#### Entry Fields
| Field               | Type   | Description                                           |
|---------------------|--------|-------------------------------------------------------|
| `id`                | string | Unique identifier (UUID)                              |
| `content`           | string | Full text content of the journal entry                |
| `mood`              | string | User's mood (neutral, positive, reflective, challenged)|
| `color_state`       | string | UI state when entry was created (ORANGE, RED, etc.)   |
| `word_count`        | number | Number of words in the entry (auto-calculated)        |
| `duration_seconds`  | number | Time spent writing the entry (in seconds)             |
| `created_at`        | string | ISO 8601 timestamp of entry creation                  |

#### Pagination Fields
| Field      | Type    | Description                                     |
|------------|---------|-------------------------------------------------|
| `total`    | number  | Total number of matching entries                |
| `limit`    | number  | Number of entries requested                     |
| `offset`   | number  | Starting position (0-indexed)                   |
| `hasMore`  | boolean | Whether more entries exist beyond current page  |
| `returned` | number  | Actual number of entries returned in response   |

---

## Error Responses

### 401 Unauthorized
User is not authenticated.

```json
{
  "success": false,
  "error": "Unauthorized - Please sign in to view your journal history"
}
```

### 500 Internal Server Error
Database query failed or unexpected error occurred.

```json
{
  "success": false,
  "error": "Failed to fetch journal entries"
}
```

---

## Implementation Details

### Security
- **Row Level Security (RLS)**: Enforced at database level - users can only see their own entries
- **User ID filtering**: All queries are automatically scoped to the authenticated user's ID
- **Input sanitization**: Search queries are properly escaped via Supabase's `ilike` operator

### Performance
- **Indexed queries**: Uses database indexes on `user_id` and `created_at` for fast retrieval
- **Pagination**: Range-based pagination prevents loading all entries at once
- **Field selection**: Only returns necessary fields, reducing payload size

### Search Behavior
- **Case-insensitive**: Uses PostgreSQL's `ILIKE` operator
- **Partial matching**: Searches for the query anywhere in the content field
- **Trimmed input**: Leading/trailing whitespace is automatically removed
- **Combined with filters**: Search works alongside user_id filtering

### Sort Order
- **Default**: Entries are returned in descending order by `created_at` (newest first)
- **Consistent**: Sort order is applied before pagination for stable results

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Fetch first page of journal entries
async function fetchJournalHistory(page = 0, limit = 30) {
  const offset = page * limit;
  const response = await fetch(
    `/api/journal/history?limit=${limit}&offset=${offset}`
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    throw new Error('Failed to fetch journal history');
  }
  
  const data = await response.json();
  return data;
}

// Search journal entries
async function searchJournal(query: string) {
  const response = await fetch(
    `/api/journal/history?search=${encodeURIComponent(query)}&limit=50`
  );
  
  if (!response.ok) {
    throw new Error('Search failed');
  }
  
  return await response.json();
}

// Infinite scroll implementation
async function loadMore(currentOffset: number, limit = 30) {
  const response = await fetch(
    `/api/journal/history?offset=${currentOffset}&limit=${limit}`
  );
  
  const data = await response.json();
  
  if (data.success && data.pagination.hasMore) {
    // Load more entries
    return data.entries;
  }
  
  return [];
}
```

### cURL Examples

```bash
# Basic request with authentication
curl -X GET 'https://yourdomain.com/api/journal/history' \
  -H 'Cookie: sb-access-token=YOUR_TOKEN'

# Pagination
curl -X GET 'https://yourdomain.com/api/journal/history?limit=10&offset=30' \
  -H 'Cookie: sb-access-token=YOUR_TOKEN'

# Search
curl -X GET 'https://yourdomain.com/api/journal/history?search=grateful' \
  -H 'Cookie: sb-access-token=YOUR_TOKEN'
```

---

## Database Schema Reference

### Table: `journal_entries`

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  color_state TEXT DEFAULT 'ORANGE',
  duration_seconds INT DEFAULT 0,
  word_count INT DEFAULT 0,
  email_queued BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relevant Indexes
- `idx_journal_entries_user_id ON journal_entries(user_id)`
- `idx_journal_entries_created_at ON journal_entries(created_at DESC)`

### RLS Policy
```sql
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (user_id = auth.uid());
```

---

## Testing

Tests are located at: `tests/api/journal/history.test.ts`

### Test Coverage
- ✅ Authentication (401 responses)
- ✅ Successful queries (200 responses)
- ✅ User ID filtering
- ✅ Pagination (limit, offset, hasMore)
- ✅ Search functionality
- ✅ Error handling
- ✅ Response format validation

Run tests with:
```bash
npm run test:run tests/api/journal/history.test.ts
```

---

## Rate Limiting

**Current**: No rate limiting implemented

**Recommendation**: Consider adding rate limiting in production:
- 100 requests per minute per user
- 1000 requests per hour per user

---

## Future Enhancements

1. **Filter by mood**: Add `?mood=positive` parameter
2. **Date range filtering**: Add `?from=2026-01-01&to=2026-01-31`
3. **Sort options**: Allow sorting by word_count, duration, etc.
4. **Cursor-based pagination**: For more stable pagination with concurrent writes
5. **Export functionality**: Generate PDF/CSV of journal entries
6. **Aggregate stats**: Return summary statistics (total entries, avg word count, etc.)

---

## Support

For issues or questions:
- Check authentication is working correctly
- Verify Supabase connection is active
- Review server logs for detailed error messages
- Ensure RLS policies are correctly configured

---

**Last Updated**: 2026-02-18  
**API Version**: 1.0  
**Status**: Production Ready ✅

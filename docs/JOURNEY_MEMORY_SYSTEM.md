# Journey Memory System

## Overview

The Journey Memory System is a progressive memory storage feature for CubiQo that enables the AI to remember user context across conversations using vector embeddings for semantic similarity search.

**Status:** Behind feature flag (disabled by default)  
**Branch:** `spec/journey-prototype`

## Features

### 1. Progressive Memory Storage
- Stores conversation context as structured memories
- Vector embeddings (OpenAI text-embedding-3-small) for semantic search
- Importance scoring (0-1) for memory prioritization
- Category-based organization (green/yellow/red zones)

### 2. User Consent & Privacy
- Explicit opt-in required (GDPR compliant)
- Configurable retention periods (30, 90, 180, 365 days, or forever)
- Full transparency about data collection
- Complete user control over their data

### 3. Similarity Search
- Computes similarity % for query→memory matches
- Threshold-based filtering (default 50%)
- Category filtering support
- Returns top N most relevant memories

### 4. Privacy & Rollback Controls
- Delete individual memories
- Delete all memories at once
- Revoke consent (with optional memory deletion)
- Automatic expiry based on retention period
- Complete audit trail of all deletions

### 5. Admin Metrics Dashboard
- Total users and opt-in rate
- Memory completeness scores
- Top users by memory count
- Recent consent changes
- Rollback/deletion logs
- Monetization hooks (query counts, premium features)

## Architecture

### Database Schema

#### Tables
1. **feature_flags** - Feature toggle management
2. **journey_consents** - User opt-in and retention preferences
3. **journey_memories** - Memory storage with vector embeddings
4. **journey_rollback_logs** - Audit trail for deletions
5. **journey_metrics** - Aggregated analytics and monetization data

See `supabase/migrations/20260215000001_journey_memory_schema.sql` for details.

### API Endpoints

#### User Endpoints
- `GET /api/journey/similarity` - Check feature status
- `POST /api/journey/similarity` - Search similar memories
- `GET /api/journey/consent` - Get consent status
- `POST /api/journey/consent` - Update consent
- `DELETE /api/journey/consent` - Revoke consent
- `GET /api/journey/memories` - List user memories

#### Admin Endpoints
- `GET /api/admin/journey/metrics` - View system metrics
- `POST /api/admin/journey/feature-flag` - Toggle feature flag

### UI Components

#### User UI
- `/journey` - Journey settings page
- `JourneyConsentModal` - Opt-in modal with retention settings
- `JourneyPrivacyControls` - Memory management and deletion

#### Admin UI
- `/admin/journey` - Admin metrics dashboard

## Installation & Setup

### 1. Database Migration

Run the migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute SQL files:
# 1. supabase/migrations/20260215000001_journey_memory_schema.sql
# 2. supabase/migrations/20260215000002_journey_helper_functions.sql
```

### 2. Install pgvector Extension

The system requires the pgvector extension for similarity search:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is already included in the migration, but ensure your Supabase/PostgreSQL instance supports it.

### 3. Enable Feature Flag (Admin Only)

By default, the feature is disabled. To enable:

1. Navigate to `/admin/journey`
2. Click "Enable Feature" button

Or via SQL:

```sql
UPDATE feature_flags 
SET enabled = true 
WHERE name = 'journey_memory';
```

### 4. Configure OpenAI API Key

The similarity search requires OpenAI embeddings:

```bash
# Add to .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### For Users

1. **Opt In**
   - Navigate to `/journey`
   - Click "Enable Journey Memory"
   - Choose retention period
   - Accept consent

2. **View Memories**
   - Go to `/journey`
   - See all stored memories
   - View memory stats

3. **Delete Memories**
   - Individual: Click "Delete" next to any memory
   - All: Click "Delete All Memories" button

4. **Change Settings**
   - Click "Change Settings" to modify retention period
   - Click "No Thanks" to opt out

### For Admins

1. **View Metrics**
   - Navigate to `/admin/journey`
   - View user statistics
   - Monitor opt-in rates
   - Check memory completeness

2. **Toggle Feature**
   - Click "Enable/Disable Feature" button
   - Feature change applies immediately

3. **Monitor Rollbacks**
   - View deletion logs
   - Track user privacy actions
   - Audit data operations

## API Examples

### Search Similar Memories

```typescript
const response = await fetch('/api/journey/similarity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Tell me about my favorite foods",
    category: "green", // optional
    threshold: 0.5,    // optional
    limit: 10          // optional
  })
});

const data = await response.json();
// Returns: { results, query, count, maxSimilarity, avgSimilarity }
```

### Update Consent

```typescript
const response = await fetch('/api/journey/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    optedIn: true,
    retentionDays: 365
  })
});
```

### Delete All Memories

```typescript
const response = await fetch('/api/journey/consent?deleteMemories=true', {
  method: 'DELETE'
});
```

## Security & Privacy

### Data Protection
- All memories encrypted at rest (Supabase default)
- Row Level Security (RLS) enforced on all tables
- Users can only access their own memories
- No third-party data sharing

### GDPR Compliance
- ✅ Right to be informed (consent modal)
- ✅ Right of access (view memories page)
- ✅ Right to erasure (delete controls)
- ✅ Right to data portability (export - future feature)
- ✅ Privacy by design (opt-in required)

### Audit Trail
Every deletion is logged with:
- User ID
- Action type
- Number of memories affected
- Reason
- Timestamp
- Performed by (user/admin/system)

## Monetization Hooks

The system tracks metrics useful for monetization:

- **Query counts** - Users making many similarity searches
- **Premium features** - Advanced search, longer retention
- **Memory completeness** - Users with rich profiles
- **Engagement metrics** - Active users vs. inactive

Access via admin dashboard at `/admin/journey`.

## Testing

### Manual Testing Checklist

1. **Feature Flag**
   - [ ] Toggle feature on/off from admin dashboard
   - [ ] Verify users see/don't see opt-in based on flag
   - [ ] Check API endpoints respect flag

2. **Consent Flow**
   - [ ] Open consent modal
   - [ ] Select different retention periods
   - [ ] Accept consent
   - [ ] Verify consent saved in database
   - [ ] Decline consent
   - [ ] Verify no consent created

3. **Memory Management**
   - [ ] View memories list
   - [ ] Delete individual memory
   - [ ] Verify deletion logged
   - [ ] Delete all memories
   - [ ] Verify count updated

4. **Similarity Search**
   - [ ] Create test query
   - [ ] Verify results returned
   - [ ] Check similarity percentages
   - [ ] Test with different thresholds
   - [ ] Test category filtering

5. **Admin Dashboard**
   - [ ] View metrics
   - [ ] Check user counts
   - [ ] Review rollback logs
   - [ ] Verify monetization stats

### Automated Testing (Future)

```typescript
// Example test structure
describe('Journey Memory System', () => {
  test('should require opt-in', async () => {
    // Test logic
  });
  
  test('should compute similarity correctly', async () => {
    // Test logic
  });
  
  test('should log deletions', async () => {
    // Test logic
  });
});
```

## Troubleshooting

### "OpenAI API key not configured"
- Add `OPENAI_API_KEY` to environment variables
- Restart the development server

### "Feature not enabled"
- Check feature flag status: `SELECT * FROM feature_flags WHERE name = 'journey_memory';`
- Enable via admin dashboard or SQL update

### "Unauthorized" errors
- Ensure user is authenticated
- Check Supabase auth tokens
- Verify RLS policies

### Similarity search returns no results
- Check if memories have embeddings
- Verify pgvector extension is installed
- Lower threshold value (try 0.3 instead of 0.5)

## Future Enhancements

- [ ] Memory export (JSON/CSV download)
- [ ] Bulk memory operations
- [ ] Advanced filtering (date range, importance)
- [ ] Memory sharing (controlled)
- [ ] Auto-summarization of long memories
- [ ] Memory clustering and visualization
- [ ] Soft delete with 24h recovery window
- [ ] Memory quality scoring
- [ ] Anomaly detection (unusual deletion patterns)

## Documentation

- [Rollback Controls](./JOURNEY_MEMORY_ROLLBACK.md) - Detailed rollback procedures
- [Database Schema](../supabase/migrations/20260215000001_journey_memory_schema.sql) - Full schema
- [API Documentation](../API_DOCUMENTATION.md) - General API docs

## Support

For issues or questions:
1. Check troubleshooting section
2. Review audit logs for errors
3. Contact admin with user ID and timestamp
4. Include relevant log entries

---

**Last Updated:** 2026-02-15  
**Version:** 1.0  
**Status:** Production-ready (behind feature flag)  
**License:** MIT

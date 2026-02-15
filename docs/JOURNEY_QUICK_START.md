# Journey Memory - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- PostgreSQL database with pgvector support (Supabase recommended)
- OpenAI API key (for embeddings)
- Node.js 18+ and npm

### Step 1: Run Migrations

```bash
cd thecubiqo
supabase db push
```

Or manually in Supabase SQL Editor:
1. Execute `supabase/migrations/20260215000001_journey_memory_schema.sql`
2. Execute `supabase/migrations/20260215000002_journey_helper_functions.sql`

### Step 2: Add Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Enable Feature (Admin Only)

Option A - Via Admin UI:
1. Navigate to `http://localhost:3000/admin/journey`
2. Click "Enable Feature"

Option B - Via SQL:
```sql
UPDATE feature_flags 
SET enabled = true 
WHERE name = 'journey_memory';
```

### Step 4: Test User Flow

1. Open `http://localhost:3000/journey`
2. Click "Enable Journey Memory"
3. Choose retention period (e.g., 365 days)
4. Click "Enable Journey Memory"

✅ Done! The system is now active.

## 📝 Usage Examples

### Store a Memory (requires integration with chat system)

```typescript
// In your chat handler
const memory = {
  user_id: userId,
  session_id: sessionId,
  content: "User mentioned they love pizza",
  category: "green",
  importance_score: 0.8,
  metadata: { context: "food preferences" }
};

// Generate embedding
const embedding = await generateEmbedding(memory.content);

// Store in database
await supabase.from('journey_memories').insert({
  ...memory,
  embedding: JSON.stringify(embedding)
});
```

### Search Similar Memories

```typescript
const response = await fetch('/api/journey/similarity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What foods do I like?",
    threshold: 0.5,
    limit: 5
  })
});

const { results } = await response.json();
// results: Array of similar memories with similarity scores
```

### Check Consent Status

```typescript
const response = await fetch('/api/journey/consent');
const { optedIn, consent } = await response.json();

if (!optedIn) {
  // Show consent modal
  showConsentModal();
}
```

## 🎯 Integration Points

### 1. Chat System Integration

Add this to your chat handler (`src/app/api/chat/route.ts`):

```typescript
// After successful chat response
if (userOptedInToJourney) {
  await extractAndStoreMemory({
    userId: user.id,
    sessionId: session.id,
    conversationId: conversation.id,
    message: userMessage,
    response: aiResponse
  });
}
```

### 2. Memory Extraction

Create a helper function:

```typescript
// src/lib/journey/extract-memory.ts
export async function extractAndStoreMemory(params) {
  // 1. Analyze message for memorable content
  const analysis = await analyzeMessage(params.message);
  
  if (!analysis.hasMemorableContent) return;
  
  // 2. Generate embedding
  const embedding = await generateEmbedding(analysis.content);
  
  // 3. Store memory
  await supabase.from('journey_memories').insert({
    user_id: params.userId,
    session_id: params.sessionId,
    conversation_id: params.conversationId,
    content: analysis.content,
    summary: analysis.summary,
    category: analysis.category,
    importance_score: analysis.importance,
    embedding: JSON.stringify(embedding),
    metadata: analysis.metadata
  });
}
```

### 3. Memory Retrieval in Chat

Before generating AI response:

```typescript
// Search for relevant memories
const relevantMemories = await fetch('/api/journey/similarity', {
  method: 'POST',
  body: JSON.stringify({
    query: userMessage,
    threshold: 0.6,
    limit: 3
  })
});

// Add to AI context
const context = relevantMemories.results.map(m => m.content).join('\n');
const systemMessage = `Context from previous conversations:\n${context}`;
```

## 🔧 Configuration

### Adjust Retention Defaults

Edit `supabase/migrations/20260215000001_journey_memory_schema.sql`:

```sql
INSERT INTO feature_flags (name, enabled, description, config)
VALUES (
  'journey_memory',
  false,
  'Progressive memory system with consent and privacy controls',
  '{"version": "1.0", "max_memories_per_user": 10000, "retention_days_default": 365}'::jsonb
);
```

### Configure Vector Index

For better performance with large datasets:

```sql
-- Adjust IVFFlat lists parameter
CREATE INDEX idx_journey_memories_embedding ON journey_memories 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100); -- Increase for more data
```

## 📊 Monitoring

### Check System Health

```sql
-- Total memories
SELECT COUNT(*) FROM journey_memories;

-- Opt-in rate
SELECT 
  COUNT(*) FILTER (WHERE opted_in = true) * 100.0 / COUNT(*) as opt_in_rate
FROM journey_consents
WHERE revoked_at IS NULL;

-- Average memories per user
SELECT AVG(memory_count) FROM (
  SELECT COUNT(*) as memory_count 
  FROM journey_memories 
  GROUP BY user_id
) subquery;

-- Recent rollbacks
SELECT * FROM journey_rollback_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Admin Dashboard

Visit `/admin/journey` for real-time metrics:
- User counts and opt-in rates
- Memory statistics
- Top users
- Recent consents
- Rollback logs
- Monetization metrics

## 🐛 Common Issues

**Issue:** "Feature not enabled"
- **Fix:** Toggle feature flag in admin dashboard

**Issue:** No similarity results
- **Fix:** Check if memories have embeddings, lower threshold

**Issue:** Slow queries
- **Fix:** Ensure pgvector index is created, increase IVFFlat lists

**Issue:** OpenAI errors
- **Fix:** Verify API key, check rate limits

## 🎓 Learning Path

1. **Day 1:** Setup database and feature flag
2. **Day 2:** Test consent flow and memory storage
3. **Day 3:** Integrate with chat system
4. **Day 4:** Test similarity search
5. **Day 5:** Configure monitoring and metrics

## 📚 Next Steps

- [ ] Read [full documentation](./JOURNEY_MEMORY_SYSTEM.md)
- [ ] Review [rollback procedures](./JOURNEY_MEMORY_ROLLBACK.md)
- [ ] Integrate with chat system
- [ ] Configure monitoring alerts
- [ ] Test with real users (small group)
- [ ] Gather feedback and iterate

## 🆘 Need Help?

1. Check [troubleshooting guide](./JOURNEY_MEMORY_SYSTEM.md#troubleshooting)
2. Review audit logs: `SELECT * FROM journey_rollback_logs`
3. Check feature flag: `SELECT * FROM feature_flags WHERE name = 'journey_memory'`
4. Test API directly: `curl -X POST localhost:3000/api/journey/similarity`

---

**Time to Production:** ~30 minutes  
**Difficulty:** Intermediate  
**Status:** Production-ready (behind feature flag)

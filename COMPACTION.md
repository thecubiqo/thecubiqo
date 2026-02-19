# Session Compaction Feature

## Overview

Session compaction prevents long conversations from consuming excessive tokens by automatically summarizing older messages while preserving recent context and important information.

## How It Works

### Automatic Compaction

When a session reaches **75% of the model's token limit**, compaction is triggered automatically before the next agent run. This ensures conversations can continue indefinitely without hitting token limits.

### Compaction Strategy

1. **Keep System Messages**: All system prompts are preserved
2. **Keep First Message**: The initial user message is kept for context
3. **Keep Recent Messages**: Last 10 messages (default) are preserved
4. **Summarize Middle**: Everything between first and recent messages is summarized using the LLM

### Token Limits

Default limits per model:
- Claude 3.5 Sonnet: 200,000 tokens
- Claude 3 Opus: 200,000 tokens  
- GPT-4 Turbo: 128,000 tokens
- GPT-4: 8,192 tokens

Compaction triggers at 75% of limit (e.g., 150,000 tokens for Claude).

## Implementation

### Core Components

#### 1. Token Counter (`src/lib/utils/token-counter.ts`)
```typescript
// Estimate tokens for a message
countMessageTokens(message)

// Count total tokens in conversation
countConversationTokens(messages)

// Check if compaction is needed
shouldCompact(currentTokens, modelName, threshold = 0.75)
```

#### 2. Session Store (`src/lib/engine/session.ts`)
```typescript
// Compact a session
await sessionStore.compactSession(sessionId, model, {
  keepRecentCount: 10,
  forceCompact: false
});

// Check if compaction is needed
sessionStore.needsCompaction(sessionId, modelName)

// Get token statistics
sessionStore.getTokenStats(sessionId)
```

#### 3. Agent (`src/lib/engine/agent.ts`)
Automatic compaction is triggered before each agent run:
```typescript
if (this.sessionStore.needsCompaction(session.id, this.model.model)) {
  await this.sessionStore.compactSession(session.id, this.model);
}
```

### API Endpoint

**POST** `/api/sessions/[id]/compact`

Request body:
```json
{
  "agentId": "agent-id",
  "forceCompact": false,
  "keepRecentCount": 10
}
```

Response:
```json
{
  "success": true,
  "message": "Session compacted successfully",
  "stats": {
    "messagesBefore": 51,
    "messagesAfter": 13,
    "originalTokens": 2503,
    "compactedTokens": 631,
    "tokensSaved": 1872,
    "savingsPercent": "74.8"
  }
}
```

**GET** `/api/sessions/[id]/compact?agentId=xxx`

Get compaction statistics without performing compaction:
```json
{
  "sessionId": "session-id",
  "stats": {
    "totalTokens": 45000,
    "messageCount": 50,
    "averageTokensPerMessage": 900
  },
  "needsCompaction": false,
  "model": "claude-3-5-sonnet-20241022"
}
```

## Message Types

The compaction system adds a new message type: `summary`

```typescript
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'summary';
  content: string;
  isSummary?: boolean;
  summarizedMessageIds?: string[];  // IDs of messages this summary replaces
}
```

## Testing

### Unit Test
```bash
node test-compaction-simple.mjs
```

Verifies:
- Token counting logic
- Compaction threshold detection
- Message preservation strategy
- Token savings calculation

### Integration Test (requires build)
```bash
npm run build
npx tsx scripts/test-compaction.ts
```

Tests full compaction flow with LLM summarization.

### API Test
```bash
# Start dev server first
npm run dev

# In another terminal
./test-api-compaction.sh
```

## Configuration

Adjust compaction behavior in your code:

```typescript
// Change threshold (default 0.75 = 75%)
sessionStore.needsCompaction(sessionId, modelName, 0.80); // Trigger at 80%

// Keep more recent messages
await sessionStore.compactSession(sessionId, model, {
  keepRecentCount: 20  // Keep last 20 instead of 10
});

// Force compaction even if not needed
await sessionStore.compactSession(sessionId, model, {
  forceCompact: true
});
```

## Performance

**Typical Results** (50-message conversation):
- Messages: 51 → 13 (74.5% reduction)
- Tokens: ~2,500 → ~630 (74.8% savings)
- Processing time: ~2-5 seconds (depends on LLM)

**Cost**: Each compaction requires one LLM call (~$0.01-0.05 depending on model)

## Logging

Compaction events are logged with the `[Compaction]` prefix:

```
[Compaction] Starting for session abc-123
[Compaction] Original: 51 messages, ~2503 tokens
[Compaction] Complete!
[Compaction] After: 13 messages, ~631 tokens
[Compaction] Saved: ~1872 tokens (74.8%)
```

Agent logs automatic triggers:
```
[Agent] Auto-compacting session abc-123
[Agent] Compaction saved ~1872 tokens
```

## Best Practices

1. **Let it happen automatically**: The 75% threshold works well for most use cases
2. **Monitor costs**: Each compaction uses tokens for summarization
3. **Adjust keepRecentCount** for your use case:
   - Higher (15-20) for tasks needing more context
   - Lower (5-10) for simple Q&A
4. **Check logs**: Monitor compaction frequency and savings
5. **Manual compaction**: Use the API endpoint for testing or special cases

## Future Enhancements

Potential improvements:
- Persistent storage (Supabase) for compacted sessions
- Configurable compaction strategies (different summarization prompts)
- Smart context preservation (identify important messages automatically)
- Multi-level compaction for very long sessions
- Token usage analytics and visualization

## Troubleshooting

**Compaction not triggering?**
- Check token count: `sessionStore.getTokenStats(sessionId)`
- Verify threshold: Default is 75% of model limit
- Check logs for `[Compaction]` messages

**Too aggressive/conservative?**
- Adjust threshold in `needsCompaction()` call
- Modify `keepRecentCount` parameter
- Consider your model's context window

**API returns 404?**
- Verify agent ID is correct
- Check session exists: GET `/api/agents/[id]/sessions`
- Ensure dev server is running

## Files Changed

- `src/types/session.ts` - Added summary role and compaction fields
- `src/lib/utils/token-counter.ts` - NEW: Token estimation utilities
- `src/lib/engine/session.ts` - Added compaction logic
- `src/lib/engine/agent.ts` - Added auto-trigger before runs
- `src/app/api/sessions/[id]/compact/route.ts` - NEW: API endpoint
- `scripts/test-compaction.ts` - NEW: Integration test
- `test-compaction-simple.mjs` - NEW: Unit test
- `test-api-compaction.sh` - NEW: API test script
- `COMPACTION.md` - NEW: This documentation

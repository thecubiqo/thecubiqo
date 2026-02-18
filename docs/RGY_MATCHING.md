# RGY Intelligent Matching System

## Overview

The RGY Intelligent Matching System is an AI-powered opportunity discovery platform that connects users with relevant rooms, events, connections, and activities based on their interests and RGY context (Red, Yellow, Green).

## Features

### 1. **User Intents**
- Users express their interests through keywords and descriptions
- Intents are organized by RGY context:
  - **Green** (Progressive): Growth, wellness, career, ambitions
  - **Yellow** (Sit back): Relaxation, social connections, casual hangouts
  - **Red** (Indulge): Desire, exploration, deep connections
- Vector embeddings enable semantic matching

### 2. **Opportunity Discovery**
- AI-powered matching using vector similarity
- Opportunities include:
  - **Rooms**: Ongoing discussion spaces
  - **Events**: Time-bound gatherings
  - **Connections**: One-on-one matches
  - **Activities**: Group activities and experiences

### 3. **Pro Match Subscription**
- Opt-in service for automated opportunity discovery
- Configurable preferences:
  - Discovery frequency (daily, weekly, monthly)
  - Maximum suggestions per run
  - Notification preferences
- Background AI agent actively searches for opportunities

### 4. **Match Status Tracking**
- **Suggested**: AI-discovered opportunities
- **Interested**: User expressed interest
- **Joined**: User joined the opportunity
- **Declined**: User declined the opportunity
- **Expired**: Opportunity no longer available

## Architecture

### Database Schema

The system uses PostgreSQL with pgvector extension for vector similarity search:

- **`user_intents`**: User interests and keywords per RGY context
- **`opportunities`**: Available matchable opportunities
- **`matches`**: Tracks user-opportunity relationships
- **`pro_match_subscriptions`**: Pro match opt-in and preferences

### API Endpoints

#### Intent Management
- `POST /api/rgy/intents` - Create/update user intents
- `GET /api/rgy/intents` - Retrieve user intents
- `DELETE /api/rgy/intents?context={context}` - Deactivate intent

#### Opportunity Discovery
- `POST /api/rgy/opportunities/discover` - Discover matching opportunities
- `POST /api/rgy/opportunities/express-interest` - Express interest in opportunity

#### Subscription Management
- `GET /api/rgy/subscription` - Get subscription status
- `POST /api/rgy/subscription` - Create/update subscription

#### Background Jobs
- `GET /api/cron/rgy-discovery` - Run discovery for all subscribers (cron)

### AI Matching Algorithm

1. **Embedding Generation**: User intents and opportunities are converted to 1536-dimensional vectors using OpenAI's text-embedding-ada-002 model
2. **Similarity Search**: PostgreSQL's pgvector performs cosine similarity search
3. **Ranking**: Results sorted by similarity score (0.0000 to 1.0000)
4. **Filtering**: Expired and inactive opportunities removed
5. **Deduplication**: Unique opportunities across multiple intents

## Usage Guide

### For Users

#### 1. Set Your Intents

```typescript
// Example: Save intent for Green (Progressive) context
const response = await fetch('/api/rgy/intents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rgy_context: 'green',
    keywords: ['yoga', 'wellness', 'morning routine', 'health'],
    intent_description: 'Looking for morning wellness activities'
  })
});
```

#### 2. Discover Opportunities

```typescript
// Discover opportunities matching your intents
const response = await fetch('/api/rgy/opportunities/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rgy_context: 'green', // Optional: filter by context
    limit: 10
  })
});

const { discoveries } = await response.json();
```

#### 3. Express Interest

```typescript
// Show interest in an opportunity
const response = await fetch('/api/rgy/opportunities/express-interest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    opportunity_id: 'uuid-here'
  })
});
```

#### 4. Enable Pro Match

```typescript
// Opt in to automated discovery
const response = await fetch('/api/rgy/subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    is_active: true,
    preferences: {
      discovery_frequency: 'weekly',
      notification_enabled: true,
      max_suggestions: 10
    }
  })
});
```

### For Administrators

#### Run Manual Discovery

You can trigger discovery manually using the cron endpoint:

```bash
curl -X GET https://your-domain.com/api/cron/rgy-discovery \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Schedule Automatic Discovery

Configure a cron job or scheduled task:

**Vercel Cron (vercel.json)**:
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

**GitHub Actions**:
```yaml
name: RGY Discovery
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  discover:
    runs-on: ubuntu-latest
    steps:
      - name: Run Discovery
        run: |
          curl -X GET ${{ secrets.APP_URL }}/api/cron/rgy-discovery \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=sk-...

# Cron job secret (required for automated discovery)
CRON_SECRET=your-secure-random-string
```

### Database Setup

Run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute
psql $DATABASE_URL < supabase/migrations/20260218000001_rgy_intelligent_matching.sql
```

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS policies
2. **Authentication**: All endpoints require authenticated users
3. **Rate Limiting**: Consider implementing rate limits on discovery endpoints
4. **Data Privacy**: User intents are encrypted at rest
5. **Cron Security**: Cron endpoints protected with secret token

## Performance Optimization

1. **Vector Indexes**: IVFFlat indexes for fast similarity search
2. **Query Limits**: Default limit of 10-50 results per discovery
3. **Caching**: Consider Redis for frequently accessed opportunities
4. **Batch Processing**: Cron job processes users sequentially to avoid overload

## Monitoring & Analytics

Track these metrics:

- Active pro match subscriptions
- Discovery success rate
- Average similarity scores
- Popular opportunity types
- Conversion rate (suggested → interested → joined)

## Future Enhancements

1. **AI-Generated Opportunities**: GPT-4 creates opportunities based on trending topics
2. **Real-time Notifications**: WebSocket or push notifications for new matches
3. **Advanced Filtering**: Location, time, skill level, etc.
4. **Social Proof**: Show mutual connections, popularity metrics
5. **Feedback Loop**: Learn from user interactions to improve matching

## Troubleshooting

### No opportunities discovered

- Check if user has active intents
- Verify opportunities exist in the database
- Ensure OpenAI API key is configured
- Check embedding generation logs

### Low similarity scores

- Improve keyword selection
- Add more descriptive intent descriptions
- Verify opportunities have relevant keywords
- Check embedding quality

### Cron job not running

- Verify `CRON_SECRET` is set
- Check cron schedule configuration
- Review server logs for errors
- Ensure endpoint is not rate-limited

## API Reference

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API specifications.

## Support

For issues or questions:
- GitHub Issues: https://github.com/thecubiqo/thecubiqo/issues
- Email: support@cubiqo.ai

---

**Built with ❤️ by the CubiQo team**

# Agents and Onboarding Feature

This document describes the new agents registry, onboarding flow, agent reporting, and marketing agent template features implemented in this branch.

## Overview

This feature adds comprehensive agent management capabilities to CubiQo:

1. **Enhanced Agent Registry** - Agents now include skill tags and contact information
2. **Onboarding Flow** - Interactive onboarding with feature toggles and OAuth consent
3. **Agent Reporting** - Agents can report activities to a centralized portal
4. **Marketing Agent Template** - Pre-configured marketing agent with draft approval workflow

## Features Implemented

### 1. Agent Registry with Extended Fields

**Type Updates** (`src/types/agent.ts`):
- Added `skillTags?: string[]` - Tags describing agent capabilities
- Added `contactEmail?: string` - Contact email for the agent
- Added `contactPhone?: string` - Contact phone for the agent
- Added `AgentReport` interface for agent activity reporting

**Usage Example**:
```typescript
const marketingAgent = {
  id: 'marketing-agent',
  name: 'Marketing Agent',
  skillTags: ['email-marketing', 'copywriting', 'outreach'],
  contactEmail: 'marketing-agent@cubiqo.ai',
  contactPhone: '+1-555-MARKETING',
  // ... other fields
};
```

### 2. Onboarding Flow

**Location**: `/onboarding`

**Component**: `src/components/OnboardingFlow.tsx`

**Features**:
- **Feature Toggles** for:
  - AI Agents
  - Voice Mode
  - Code Execution
  - File Management
  - Memory & Context

- **OAuth Consent Flows** (stubs) for:
  - GitHub
  - Google
  - Slack

**User Experience**:
1. Welcome screen with feature selection
2. OAuth account connection options
3. Summary confirmation screen
4. Configuration saved to localStorage

**Example Usage**:
```tsx
import OnboardingFlow from '@/components/OnboardingFlow';

<OnboardingFlow 
  onComplete={(config) => {
    // Handle completed onboarding
    console.log('User selected:', config.featureToggles);
  }}
  onSkip={() => {
    // Handle skip
  }}
/>
```

### 3. Agent Reporting

**API Endpoint**: `GET /api/agents/reports`

**Query Parameters**:
- `agentId` (optional) - Filter reports by specific agent
- `limit` (optional) - Limit number of results

**Report Types**:
- `activity` - General agent activities
- `task_completion` - Task completion reports
- `error` - Error reports
- `status` - Status updates

**Agent Method**:
```typescript
// In AgentInstance class
await agent.createReport('activity', {
  action: 'draft_created',
  draftType: 'email'
}, 'Created email draft for outreach campaign');
```

**Portal UI**: `/agent-portal`
- Real-time report monitoring
- Filter by agent
- Report type categorization
- Activity statistics dashboard

### 4. Marketing Agent Template

**Location**: `agents/marketing-agent/SOUL.md`

**Capabilities**:
- Draft personalized email outreach
- Create compelling marketing copy
- Craft social media messages
- Generate customer engagement content
- A/B testing copy variations

**Skill Tags**:
- email-marketing
- copywriting
- outreach
- lead-generation
- content-creation

**Critical Requirement**: User Confirmation
The marketing agent is programmed to **NEVER send** content without explicit user confirmation:

```
DRAFT EMAIL - REQUIRES USER CONFIRMATION

Subject: ...
Body: ...

---
DRAFT STATUS: Awaiting approval
Would you like to approve and send this message? (yes/no)
```

**Usage Example**:
```bash
# Create the marketing agent
POST /api/agents
{
  "id": "marketing-agent",
  "name": "Marketing Agent",
  "model": { ... },
  "skillTags": ["email-marketing", "copywriting", "outreach"],
  "contactEmail": "marketing-agent@cubiqo.ai"
}

# Interact with the agent
POST /api/agents/marketing-agent/run
{
  "prompt": "Draft an outreach email for enterprise customers"
}
```

## UI Components

### Updated Components

**AgentDashboard** (`src/components/AgentDashboard.tsx`):
- Now displays skill tags
- Shows contact information (email, phone)
- Visual badges for skill tags

**New Components**:

1. **OnboardingFlow** - Multi-step onboarding wizard
2. **AgentPortalPage** - Agent activity monitoring dashboard

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all agents (includes new fields) |
| POST | `/api/agents` | Create agent (supports skillTags, contacts) |
| GET | `/api/agents/reports` | Get agent reports with filtering |
| POST | `/api/agents/[id]/run` | Run agent with prompt |

## Testing

Run the test script to verify all features:

```bash
node test-agents-onboarding.js
```

This will verify:
- ✅ Agent registry with skill tags and contact fields
- ✅ Onboarding shows feature toggles
- ✅ OAuth consent flow stubs
- ✅ Agent reporting to portal
- ✅ Marketing agent can draft outreach
- ✅ Sending requires user confirmation
- ✅ Portal records agent reports

## User Flows

### Flow 1: New User Onboarding
1. User visits `/onboarding`
2. Selects desired features (agents, voice, etc.)
3. Optionally connects OAuth accounts
4. Reviews selections and clicks "Get Started"
5. Redirected to main app with config saved

### Flow 2: Marketing Agent Draft
1. Create or select marketing agent
2. Send prompt: "Draft email for enterprise customers"
3. Agent generates draft marked as "REQUIRES CONFIRMATION"
4. User reviews draft
5. User explicitly approves before any sending action

### Flow 3: Monitor Agent Activity
1. Navigate to `/agent-portal`
2. View real-time agent reports
3. Filter by specific agent if desired
4. Review activity statistics
5. Investigate specific reports with full data

## Configuration Storage

**Onboarding Config** is stored in localStorage:
```json
{
  "completed": true,
  "timestamp": "2026-02-15T02:00:00.000Z",
  "config": {
    "featureToggles": { ... },
    "oauthConnections": { ... }
  }
}
```

## Security Considerations

1. **OAuth Flows**: Current implementation includes stubs. Production deployment requires:
   - Proper OAuth 2.0 implementation
   - Secure token storage (encrypted)
   - PKCE for public clients
   - Token refresh mechanism

2. **Marketing Agent**: 
   - Enforced user confirmation workflow
   - No automatic sending capability
   - All drafts clearly marked as requiring approval
   - Audit trail through agent reports

3. **Agent Reports**:
   - Reports stored in memory (production should use database)
   - No PII should be logged without consent
   - Reports can include sensitive data - ensure proper access controls

## Future Enhancements

Potential improvements for future iterations:

1. **Database persistence** for agent reports
2. **Full OAuth implementation** with real providers
3. **Email sending API integration** for marketing agent
4. **Advanced filtering** in agent portal
5. **Real-time WebSocket** updates for reports
6. **Agent marketplace** to discover and install agents
7. **Skill tag taxonomy** with predefined categories
8. **Agent certification** for trusted agents

## Migration Notes

No database migrations required - all new fields are optional and backward compatible.

Existing agents will work without modifications. New fields can be added incrementally:

```typescript
// Update existing agent
PATCH /api/agents/existing-agent
{
  "skillTags": ["data-analysis", "reporting"],
  "contactEmail": "agent@example.com"
}
```

## Support

For issues or questions about this feature:
- Check the test script output: `node test-agents-onboarding.js`
- Review agent SOUL files in `agents/*/SOUL.md`
- Check console logs in agent portal and onboarding flows
- Review API responses for detailed error messages

## Acceptance Criteria ✅

All acceptance criteria from the problem statement have been met:

- ✅ Onboarding shows toggles and OAuth stubs
- ✅ Agent can draft outreach
- ✅ Portal records agent reports
- ✅ Sending requires user confirmation

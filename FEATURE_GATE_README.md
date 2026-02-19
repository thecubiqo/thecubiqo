# Feature Gate System

## Overview

The Feature Gate system allows founders to control which features are available to regular users. Founders always have full access to everything, while regular users only see features that have been "released."

## Architecture

### Database Layer
- **Table:** `released_features`
- **Migration:** `supabase/migrations/20250209000001_released_features.sql`
- Stores the release status of each feature
- Includes timestamps and audit trail (who released it, when)

### Feature Definitions
- **File:** `src/lib/auth/feature-flags.ts`
- Defines all available features
- Specifies which features can be released vs. permanently founder-only

### Access Control
- **File:** `src/lib/auth/founders.ts`
- Contains founder email list
- Implements `getFeatureAccess()` function
- Checks if user is founder → full access
- Regular user → only released features
- Not authenticated → public access (very limited)

### API Endpoint
- **GET /api/admin/features** - List all features with their status
- **POST /api/admin/features** - Toggle feature release (founder-only)

### Admin UI
- **Page:** `/admin/gate`
- Visual interface for toggling features
- Shows all features with their status
- Clearly marks permanently founder-only features

## Features

### Can Be Released (Core Features)
1. **agents** - AI Agents system
2. **files** - File management
3. **memory** - Memory system
4. **codeExecution** - Code execution
5. **browser** - Browser control
6. **integrations** - Third-party integrations

### Permanently Founder-Only (Admin Features)
1. **admin** - Admin panel access
2. **deploy** - Deployment capabilities
3. **featureGate** - This feature gate system itself

## Setup Instructions

### 1. Apply Database Migration

If using Supabase CLI:
```bash
cd thecubiqo
supabase db push
```

If applying manually (Supabase Dashboard → SQL Editor):
```sql
-- Copy and run the contents of:
-- supabase/migrations/20250209000001_released_features.sql
```

### 2. Verify Migration

Check that the table exists and has initial data:
```sql
SELECT * FROM released_features ORDER BY feature_name;
```

Should return 9 rows (one for each feature), all with `is_released = false`.

### 3. Configure Founder Emails

Edit `src/lib/auth/founders.ts`:
```typescript
const FOUNDER_EMAILS = ['aditya@cubiqo.ai', 'your-email@domain.com']
```

### 4. Access the Admin Panel

1. Sign in with a founder email
2. Navigate to `/admin/gate`
3. Toggle features on/off

## Usage

### Checking Feature Access in Code

```typescript
import { hasFeatureAccess } from '@/lib/auth'

// In a Server Component or API route
const user = await getCurrentUser()
const canUseAgents = await hasFeatureAccess(user, 'agents')

if (!canUseAgents) {
  return <div>Feature not available</div>
}
```

### Getting Full Access Object

```typescript
import { getFeatureAccess } from '@/lib/auth'

const user = await getCurrentUser()
const access = await getFeatureAccess(user)

// access = { agents: true, files: false, ... }
```

### Conditionally Rendering UI

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getFeatureAccess } from '@/lib/auth'

export function FeatureMenu() {
  const [access, setAccess] = useState(null)
  
  useEffect(() => {
    // In client components, call through an API
    fetch('/api/user/features')
      .then(r => r.json())
      .then(setAccess)
  }, [])
  
  return (
    <nav>
      {access?.agents && <Link href="/agents">Agents</Link>}
      {access?.files && <Link href="/files">Files</Link>}
      {access?.memory && <Link href="/memory">Memory</Link>}
    </nav>
  )
}
```

## Testing

### Test Feature Toggle

1. Go to `/admin/gate` as a founder
2. Toggle "AI Agents" to Public
3. Verify in database:
   ```sql
   SELECT * FROM released_features WHERE feature_name = 'agents';
   -- Should show is_released = true, released_at = timestamp
   ```
4. Sign in with a non-founder test account
5. Check they now have access to agents feature
6. Toggle back to Private
7. Verify access is immediately revoked

### Test Founder-Only Features

1. Try to toggle "Admin Panel" to Public
2. Should fail with error: "Feature cannot be released (founder-only)"
3. Verify in UI that admin features show "🔒 Founder Only" badge

### Test Access Control

```typescript
// Create a test script
import { getFeatureAccess } from '@/lib/auth'

// Test founder access
const founderUser = { email: 'aditya@cubiqo.ai', id: '...' }
const founderAccess = await getFeatureAccess(founderUser)
console.assert(founderAccess.agents === true)
console.assert(founderAccess.admin === true)

// Test regular user access (with agents released)
const regularUser = { email: 'user@example.com', id: '...' }
const userAccess = await getFeatureAccess(regularUser)
console.assert(userAccess.agents === true) // if released
console.assert(userAccess.admin === false) // always false
```

## API Reference

### GET /api/admin/features

Returns all features with metadata.

**Response:**
```json
{
  "features": [
    {
      "id": "uuid",
      "feature_name": "agents",
      "is_released": false,
      "description": "AI Agents - Spawn and manage AI agents",
      "released_at": null,
      "released_by": null,
      "canRelease": true,
      "metadata": {
        "name": "AI Agents",
        "description": "Spawn and manage AI agents for complex tasks",
        "category": "Core",
        "releasable": true
      }
    }
  ],
  "timestamp": "2025-02-09T..."
}
```

### POST /api/admin/features

Toggle feature release status. Founder-only.

**Request:**
```json
{
  "featureName": "agents",
  "isReleased": true
}
```

**Response:**
```json
{
  "success": true,
  "feature": { /* updated feature object */ },
  "timestamp": "2025-02-09T..."
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not a founder
- `400` - Invalid request or trying to release founder-only feature
- `500` - Database error

## Security Notes

1. **Founder-only features CANNOT be released** - Protected at API level
2. **Founder check happens on every request** - No caching of permissions
3. **RLS policies protect the database** - Even with direct DB access, only authenticated users can update
4. **Audit trail maintained** - `released_by` and `released_at` track who released what and when

## Future Enhancements

- [ ] Feature release scheduling (auto-release at specific time)
- [ ] Percentage rollouts (release to 10% of users first)
- [ ] User segmentation (release to specific user groups)
- [ ] Feature analytics (track usage after release)
- [ ] Rollback history (quickly undo releases)
- [ ] Email notifications on feature releases

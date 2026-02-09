# Enable Database - Unmock Instructions

**Status:** Currently running in MOCK MODE (no database persistence)

**To enable full database functionality:**

## Step 1: Apply SQL Migration

Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/naoxezcmcauecawchgjk/sql/new

```sql
-- See SINGLE_MIGRATION.sql for complete SQL
```

Or use the file: `/root/clawd/thecubiqo/SINGLE_MIGRATION.sql`

## Step 2: Uncomment Real Code

Search for `TODO: Replace with real DB after migrations` in these files:

### File 1: `src/lib/auth/feature-flags.ts`

**Line ~125:** `getReleasedFeatures()`
```typescript
// CURRENT (MOCK):
export async function getReleasedFeatures(): Promise<FeatureAccess> {
  console.log('[MOCK] getReleasedFeatures')
  return DEFAULT_USER_ACCESS
}

// REPLACE WITH:
export async function getReleasedFeatures(): Promise<FeatureAccess> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('released_features')
      .select('feature_name, is_released')
      .eq('is_released', true)
    
    if (error) {
      console.error('Error fetching released features:', error)
      return DEFAULT_USER_ACCESS
    }
    
    const access: FeatureAccess = { ...DEFAULT_USER_ACCESS }
    if (data) {
      data.forEach((row) => {
        const featureName = row.feature_name as keyof FeatureAccess
        if (featureName in access) {
          access[featureName] = true
        }
      })
    }
    
    PERMANENTLY_FOUNDER_ONLY.forEach((feature) => {
      access[feature] = false
    })
    
    return access
  } catch (error) {
    console.error('Exception fetching released features:', error)
    return DEFAULT_USER_ACCESS
  }
}
```

**Line ~245:** `getAllFeatureFlags()`
```typescript
// CURRENT (MOCK):
export async function getAllFeatureFlags(): Promise<FeatureAccess> {
  console.log('[MOCK] getAllFeatureFlags')
  return { ...FOUNDER_ACCESS }
}

// REPLACE WITH:
export async function getAllFeatureFlags(): Promise<FeatureAccess> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('released_features')
      .select('feature_name, is_released')
    
    if (error) {
      console.warn('Failed to fetch all feature flags:', error)
      return { ...FOUNDER_ACCESS }
    }
    
    const flags: FeatureAccess = { ...FOUNDER_ACCESS }
    if (data) {
      for (const row of data) {
        if (row.feature_name in flags) {
          flags[row.feature_name as keyof FeatureAccess] = row.is_released
        }
      }
    }
    
    return flags
  } catch (err) {
    console.warn('Error fetching all feature flags:', err)
    return { ...FOUNDER_ACCESS }
  }
}
```

**Line ~260:** `updateFeatureFlag()`
```typescript
// CURRENT (MOCK):
export async function updateFeatureFlag(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  console.log('[MOCK] updateFeatureFlag:', feature, released)
  return true
}

// REPLACE WITH:
export async function updateFeatureFlag(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('released_features')
      .update({
        is_released: released,
        updated_at: new Date().toISOString(),
      })
      .eq('feature_name', feature)
    
    if (error) {
      console.error('Failed to update feature flag:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error updating feature flag:', err)
    return false
  }
}
```

### File 2: `src/lib/auth/feature-flags-client.ts`

**Replace entire file with:**
```typescript
import { createClient } from '@/lib/supabase/client'
import type { FeatureAccess } from './feature-flags'

const DEFAULT_USER_ACCESS: FeatureAccess = {
  home: true, chat: true, settings: true, cubikey: false,
  agents: false, files: false, memory: false,
  codeExecution: false, browser: false, integrations: false,
  admin: false, deploy: false, featureGate: false,
}

export async function getAllFeatureFlagsClient(): Promise<FeatureAccess> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('released_features')
      .select('feature_name, is_released')
    
    if (error) {
      console.warn('Failed to fetch all feature flags:', error)
      return { ...DEFAULT_USER_ACCESS }
    }
    
    const flags: FeatureAccess = { ...DEFAULT_USER_ACCESS }
    if (data) {
      for (const row of data) {
        if (row.feature_name in flags) {
          flags[row.feature_name as keyof FeatureAccess] = row.is_released
        }
      }
    }
    
    return flags
  } catch (err) {
    console.warn('Error fetching all feature flags:', err)
    return { ...DEFAULT_USER_ACCESS }
  }
}

export async function updateFeatureFlagClient(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('released_features')
      .update({
        is_released: released,
        updated_at: new Date().toISOString(),
      })
      .eq('feature_name', feature)
    
    if (error) {
      console.error('Failed to update feature flag:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error updating feature flag:', err)
    return false
  }
}

export async function getReleasedFeaturesClient(): Promise<FeatureAccess> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('released_features')
      .select('feature_name, is_released')
      .eq('is_released', true)
    
    if (error) {
      console.warn('Failed to fetch released features:', error)
      return DEFAULT_USER_ACCESS
    }
    
    const access: FeatureAccess = { ...DEFAULT_USER_ACCESS }
    if (data) {
      for (const row of data) {
        if (row.feature_name in access) {
          access[row.feature_name as keyof FeatureAccess] = true
        }
      }
    }
    
    return access
  } catch (err) {
    console.warn('Error fetching released features:', err)
    return DEFAULT_USER_ACCESS
  }
}
```

### File 3: `src/app/api/admin/features/route.ts`

**Line ~20:** Replace mock GET handler with real one (check file for details)

**Line ~60:** Replace mock POST handler with real one (check file for details)

### File 4: `src/app/api/integrations/route.ts`

**Replace mock with:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('integration', { ascending: true })
    
    if (error) {
      console.error('Failed to fetch integrations:', error)
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }
    
    return NextResponse.json({ integrations: integrations || [] })
  } catch (error) {
    console.error('Error in GET /api/integrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### File 5: `src/app/api/integrations/[service]/route.ts`

**Uncomment the real code sections marked with comments**

### File 6: `src/app/api/integrations/oauth/callback/[service]/route.ts`

**Replace mock with full OAuth flow (see original migration files)**

## Step 3: Test

1. Login as founder (aditya@cubiqo.ai)
2. Go to /admin/gate
3. Toggle a feature
4. Refresh page - toggle should persist
5. Go to /integrations
6. Connect a service - should save to database

## Step 4: Verify

Check Supabase tables:
- `released_features` should have 9 rows
- Toggling features should update `is_released` column
- `user_integrations` should populate when connecting services

---

**Current Status:** All features work in UI, but toggles don't persist across page reloads. Once SQL is applied and code is uncommented, full persistence is enabled.

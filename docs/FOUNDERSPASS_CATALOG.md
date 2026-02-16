# FoundersPass Dashboard - Features Catalog System

## Overview

The FoundersPass dashboard now uses a unified **Features Catalog System** that provides a single source of truth for all features and design variants, with support for global defaults and per-user overrides.

## Database Schema

### features_catalog

Single source of truth for all features and design variants:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| feature_key | TEXT | Unique identifier (e.g., `social.share_journey`, `design.plasma_wave`) |
| label | TEXT | Display name |
| description | TEXT | Human-readable description |
| category | TEXT | Category: social, communication, utility, support, visuals, admin, general |
| feature_type | TEXT | Type: toggle, design_variant, config |
| default_enabled | BOOLEAN | Global default state |
| risk_level | TEXT | Risk level: safe, warning, dangerous |
| config | JSONB | Additional config (icon, preview, order, etc.) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### user_feature_toggles

Per-user overrides for features and design preferences:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference (foreign key to profiles) |
| feature_key | TEXT | Feature reference (matches features_catalog.feature_key) |
| enabled | BOOLEAN | User's preference |
| metadata | JSONB | Additional user-specific config |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique Constraint:** `(user_id, feature_key)` - ensures one row per user per feature

## API Endpoints

### GET /api/founderspass/catalog

Returns the full features catalog with user toggle states merged.

**Response:**
```json
{
  "features": [
    {
      "id": "uuid",
      "feature_key": "social.share_journey",
      "label": "Share Journey",
      "description": "Share your journey on social media",
      "category": "social",
      "feature_type": "toggle",
      "default_enabled": false,
      "risk_level": "safe",
      "config": { "icon": "📱" },
      "user_enabled": true,
      "has_user_override": true
    }
  ],
  "categories": ["social", "communication", "utility", "support", "visuals", "admin"],
  "active_design": "design.plasma_wave"
}
```

**Notes:**
- `user_enabled` is only present if user has set an override
- `has_user_override` indicates if the user has customized this feature
- Effective state = `user_enabled` if `has_user_override`, else `default_enabled`

### POST /api/founderspass/toggle

Updates a user's feature toggle with audit logging.

**Request:**
```json
{
  "feature_key": "social.share_journey",
  "enabled": true,
  "is_design_variant": false
}
```

**Response:**
```json
{
  "success": true,
  "feature_key": "social.share_journey",
  "enabled": true,
  "label": "Share Journey"
}
```

**Special Behavior for Design Variants:**
- When `is_design_variant: true` and `enabled: true`, all other design variants are automatically disabled
- This ensures only one design variant is active at a time

**Audit Logging:**
- Every toggle change creates an entry in `feature_flag_audit` table
- Includes user, timestamp, feature label, and metadata (IP, user agent)

## Seeded Features

### Social (3 features)
- `social.share_journey` - Share Journey
- `social.friend_connections` - Friend Connections
- `social.community_board` - Community Board

### Communication (4 features)
- `communication.voice_chat` - Voice Chat ✅ (default enabled)
- `communication.text_chat` - Text Chat ✅ (default enabled)
- `communication.email_integration` - Email Integration ⚠️ (dangerous)
- `communication.calendar_sync` - Calendar Sync

### Utility (4 features)
- `utility.journal_entries` - Journal Entries ✅ (default enabled)
- `utility.mood_tracking` - Mood Tracking ✅ (default enabled)
- `utility.meditation_timer` - Meditation Timer ✅ (default enabled)
- `utility.browser_automation` - Browser Automation ⚠️ (dangerous)

### Support (3 features)
- `support.crisis_detection` - Crisis Detection ✅ (default enabled)
- `support.therapist_matching` - Therapist Matching
- `support.emergency_contacts` - Emergency Contacts ✅ (default enabled)

### Visuals (4 design variants)
- `design.plasma_wave` - Plasma Wave Field 🌊 ✅ (default active)
- `design.tech_wireframe` - Energy Wireframe Cube 📦
- `design.classic_cube` - Classic Cube 🎲
- `design.glassmorphic` - Glassmorphic Isometric Cube 💎

### Admin (3 features)
- `admin.feature_dashboard` - Feature Dashboard ⚠️ (dangerous)
- `admin.user_management` - User Management ⚠️ (dangerous)
- `admin.analytics_panel` - Analytics Panel

## Components

### HealthIndicator

Displays real-time system health status.

**Features:**
- Polls `/api/health` every 30 seconds
- Shows server, Supabase, and AI API status
- Tooltip with detailed metrics
- Manual refresh on click

**Usage:**
```tsx
import { HealthIndicator } from '@/components/common/HealthIndicator'

<HealthIndicator />
```

### DesignSelector

Allows users to select visual design variants.

**Props:**
```typescript
interface DesignSelectorProps {
  variants: DesignVariant[]
  activeDesign: string
  onSelect: (featureKey: string) => Promise<void>
  disabled?: boolean
}
```

**Usage:**
```tsx
import { DesignSelector } from '@/components/founderspass/DesignSelector'

<DesignSelector
  variants={designVariants}
  activeDesign="design.plasma_wave"
  onSelect={handleDesignSelect}
/>
```

### FeatureToggleList

Displays features grouped by category with toggle switches.

**Props:**
```typescript
interface FeatureToggleListProps {
  features: Feature[]
  category: string
  onToggle: (feature: Feature, enabled: boolean) => Promise<void>
  searchQuery?: string
}
```

**Features:**
- Shows global default and user override states
- Risk level badges (safe/warning/dangerous)
- Custom badge for user overrides
- Optimistic updates with rollback
- Search filtering

**Usage:**
```tsx
import { FeatureToggleList } from '@/components/founderspass/FeatureToggleList'

<FeatureToggleList
  features={catalog.features}
  category="social"
  onToggle={handleToggle}
  searchQuery={searchQuery}
/>
```

### AuditActivitySidebar

Displays recent feature toggle changes from audit log.

**Features:**
- Shows last 25 changes
- 10-second auto-refresh
- Action icons and colors
- Relative timestamps
- Manual refresh button

**Usage:**
```tsx
import { AuditActivitySidebar } from '@/components/founderspass/AuditActivitySidebar'

<AuditActivitySidebar />
```

## Dashboard Page

The overhauled dashboard page (`/founderspass/dashboard`) includes:

- **Search** - Filter by name, description, or feature key
- **Category Filter** - Filter by social, communication, utility, support, admin
- **State Filter** - Show all, enabled only, or disabled only
- **Health Indicator** - Real-time system status in header
- **Feature Toggles** - Grouped by category with side-by-side global/user controls
- **Design Selector** - Choose visual design variants
- **Audit Activity** - Live log of recent changes
- **Error Handling** - Comprehensive error states with retry functionality
- **Optimistic Updates** - Immediate UI feedback with automatic rollback on failure

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header with Search/Filters                    [Health]     │
├─────────────────────────────────┬───────────────────────────┤
│  Feature Toggles (2/3 width)   │  Sidebar (1/3 width)      │
│  ┌─────────────────────────┐   │  ┌─────────────────────┐  │
│  │ Social                  │   │  │ Design Selector     │  │
│  │ • Share Journey         │   │  │ 🌊 Plasma Wave [✓] │  │
│  │ • Friend Connections    │   │  │ 📦 Tech Wireframe   │  │
│  └─────────────────────────┘   │  │ 🎲 Classic Cube     │  │
│  ┌─────────────────────────┐   │  │ 💎 Glassmorphic     │  │
│  │ Communication           │   │  └─────────────────────┘  │
│  │ • Voice Chat            │   │  ┌─────────────────────┐  │
│  │ • Text Chat             │   │  │ Audit Activity      │  │
│  └─────────────────────────┘   │  │ • 2m ago: Toggle    │  │
│  ┌─────────────────────────┐   │  │ • 5m ago: Design    │  │
│  │ Utility                 │   │  │ • 10m ago: Toggle   │  │
│  │ • Journal Entries       │   │  └─────────────────────┘  │
│  └─────────────────────────┘   │                           │
└─────────────────────────────────┴───────────────────────────┘
```

## Security

### RLS Policies

**features_catalog:**
- Anyone (authenticated + anonymous) can SELECT
- Only authenticated users can INSERT/UPDATE/DELETE (admin check in API layer)

**user_feature_toggles:**
- Users can only SELECT/INSERT/UPDATE/DELETE their own toggles (`auth.uid() = user_id`)

### API Security

- All mutation endpoints require authentication
- Admin-only features enforced at API layer
- Audit logging captures all changes with metadata (IP, user agent)
- No sensitive data exposed in responses

## Migration Guide

To apply the new catalog system:

1. **Run the migration:**
   ```bash
   supabase migration up
   ```
   This creates the `features_catalog` and `user_feature_toggles` tables with seed data.

2. **Verify tables:**
   ```sql
   SELECT COUNT(*) FROM features_catalog;  -- Should return 18
   SELECT * FROM features_catalog WHERE category = 'visuals';  -- 4 design variants
   ```

3. **Update existing code:**
   - Replace direct feature flag checks with catalog lookups
   - Migrate existing user preferences to `user_feature_toggles` table
   - Update admin panels to use new API endpoints

## Testing

### Unit Tests

All new components have comprehensive unit tests:

- `tests/HealthIndicator.test.tsx` - 6 tests
- `tests/DesignSelector.test.tsx` - 7 tests  
- `tests/FeatureToggleList.test.tsx` - 9 tests

Run tests:
```bash
npm test
```

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Search filters features correctly
- [ ] Category filter works
- [ ] State filter works
- [ ] Feature toggles update database
- [ ] Optimistic updates work and rollback on error
- [ ] Design selector changes active design
- [ ] Health indicator shows correct status
- [ ] Audit log displays recent changes
- [ ] Error states display with retry buttons

## Future Enhancements

1. **Type Generation** - Run `supabase gen types typescript` to generate proper TypeScript types
2. **Design Variant Wiring** - Connect design selector to landing page cube rendering
3. **Permissions System** - Add role-based access control for admin features
4. **Analytics** - Track feature adoption and usage metrics
5. **A/B Testing** - Add percentage-based rollout support
6. **Bulk Operations** - Allow admins to toggle multiple features at once
7. **Export/Import** - Export catalog configuration as JSON for backup/restore

## Troubleshooting

### Issue: "Table 'features_catalog' does not exist"
**Solution:** Run the migration: `supabase migration up`

### Issue: Type errors with Supabase client
**Solution:** Currently using `(supabase as any)` for new tables. Generate types with:
```bash
supabase gen types typescript --local > src/types/supabase.ts
```

### Issue: Dashboard shows "Failed to load"
**Solution:** Check:
1. Supabase connection is working (`/api/health`)
2. RLS policies are enabled
3. Migration has been run
4. User is authenticated

### Issue: Toggles not persisting
**Solution:** Verify:
1. User is authenticated
2. API returns success response
3. `user_feature_toggles` table has INSERT permission
4. No console errors

## Support

For issues or questions:
1. Check this documentation
2. Review the tests for usage examples
3. Check the console for error messages
4. Review audit logs in the database
5. Contact the development team

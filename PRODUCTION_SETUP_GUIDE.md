# Production Setup Guide - Notifications System

## Quick Start

### 1. Environment Variables

Add to your `.env.local`:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: BYO Encryption (if using BYO mode)
BYO_ENCRYPTION_SECRET=your_32_byte_secret
```

### 2. Database Migration

Run the notification system migration:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using Supabase Dashboard
# 1. Go to your Supabase project
# 2. Navigate to SQL Editor
# 3. Copy and paste the content from:
#    supabase/migrations/20260218000100_notifications_system.sql
# 4. Run the SQL
```

### 3. Verify Setup

Check that these tables exist:
- `notifications`
- `user_integrations`
- `action_executions`
- `smart_home_devices`
- `notification_preferences`

### 4. Test the System

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the main app:**
   ```
   http://localhost:3000
   ```

3. **Sign in** (notifications only show for authenticated users)

4. **Look for the notification bell** in the top right (next to CQ Connect button)

5. **Test with demo page:**
   ```
   http://localhost:3000/notifications-demo
   ```

## Features Available

### In Main App
- Notification bell icon (top right, next to CQ Connect)
- Unread count badge
- Click to open notification panel
- Real-time updates
- Mark as read
- Delete notifications

### Demo Pages
- `/notifications-demo` - Interactive demo with test buttons
- `/registry-demo` - View all 27 registered integrations

## Integration Registry

To add new platforms, edit: `src/lib/notifications/integration-registry.ts`

Example:
```typescript
spotify: {
  name: 'spotify',
  type: 'productivity',
  displayName: 'Spotify',
  icon: '🎵',
  color: '#1DB954',
  description: 'Music notifications',
  requiresOAuth: true,
  capabilities: ['play', 'pause', 'skip']
}
```

Save and the system automatically supports it!

## API Endpoints

### Create Notification
```typescript
POST /api/notifications
Body: {
  integration_id: string
  type: 'message' | 'mention' | 'alert' | 'reminder' | 'device_state'
  title: string
  body?: string
  data?: object
  priority?: 0 | 1 | 2 | 3
}
```

### Get Notifications
```typescript
GET /api/notifications?limit=50&unread_only=true
```

## Troubleshooting

### Notifications not appearing?
1. Check you're signed in
2. Verify database migration ran successfully
3. Check browser console for errors
4. Verify Supabase env variables are set

### Real-time not working?
1. Check Supabase Realtime is enabled for your project
2. Verify RLS policies are set correctly
3. Check browser network tab for WebSocket connection

### Database errors?
1. Ensure migration ran successfully
2. Check RLS policies are active
3. Verify user is authenticated

## Production Deployment

### 1. Set Environment Variables
Add all env vars to your production environment (Vercel, etc.)

### 2. Run Database Migration
Apply the migration to your production database

### 3. Enable Supabase Realtime
In Supabase dashboard: Database > Replication > Enable for `notifications` table

### 4. Deploy
```bash
# Vercel
vercel --prod

# Or your deployment method
npm run build
npm run start
```

## Security Notes

- All tables use Row Level Security (RLS)
- Users can only see their own notifications
- API endpoints check authentication
- Real-time subscriptions are user-scoped

## Performance

- Indexes on all frequently queried fields
- Pagination support (default 50, max 100)
- Real-time via WebSocket (efficient)
- Automatic cleanup of old notifications (optional)

## Next Steps

1. ✅ Setup environment variables
2. ✅ Run database migration
3. ✅ Test locally
4. ✅ Verify real-time works
5. ✅ Deploy to production

---

**Status:** System is production-ready and integrated into main app!

**Questions?** Check the documentation files:
- `NOTIFICATIONS_SYSTEM_COMPLETE.md` - Full system overview
- `JUST_ADD_TO_REGISTRY_EXPLAINED.md` - How to add platforms
- `PRODUCTION_READINESS_CHECKLIST.md` - Deployment checklist

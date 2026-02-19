# Vercel Integration Setup Guide

Complete guide for setting up Vercel OAuth integration in CubiQo.

## 🎯 Overview

The Vercel integration allows founders to:
- Connect their Vercel account via OAuth
- View all their projects in the Founder Portal
- See deployment status in real-time
- Deploy with one click
- Track deployment history

## 📋 Prerequisites

1. Vercel account (free tier works)
2. Supabase database with connections tables
3. Running CubiQo app

## 🔧 Setup Steps

### 1. Create Vercel OAuth Integration

1. Go to https://vercel.com/account/integrations
2. Click "Create Integration"
3. Fill in details:
   - **Name**: CubiQo
   - **Description**: "Connect CubiQo to Vercel for one-click deployments"
   - **Logo**: Upload CubiQo logo (optional)
   - **Redirect URL**: `https://yourdomain.com/api/admin/connections/vercel/callback`
     - For local dev: `http://localhost:3000/api/admin/connections/vercel/callback`
   - **Webhook URL**: Leave empty (not needed for basic OAuth)

4. After creation, you'll receive:
   - **Client ID** (public)
   - **Client Secret** (keep secret!)

### 2. Add Environment Variables

Add to `.env.local`:

```bash
# Vercel OAuth
NEXT_PUBLIC_VERCEL_CLIENT_ID=your_vercel_client_id_here
VERCEL_CLIENT_SECRET=your_vercel_client_secret_here
```

**Important**: 
- `NEXT_PUBLIC_VERCEL_CLIENT_ID` is public (used in browser)
- `VERCEL_CLIENT_SECRET` is private (server-side only)

### 3. Run Database Migration

Run the SQL migration to create the necessary tables:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20250209_add_connections.sql
```

This creates two tables:
- `connections` - Stores OAuth tokens for all services
- `deployments` - Tracks Vercel deployment history

### 4. Test the Flow

1. **Start dev server**: `npm run dev`
2. **Login as founder**: Go to `/admin`
3. **Click "Connect Vercel"**: Should redirect to Vercel OAuth
4. **Authorize**: Grant CubiQo access to your projects
5. **Verify redirect**: Should return to admin panel with success message
6. **Check projects**: Should see list of Vercel projects

## 🎨 Features

### OAuth Connection
- Secure OAuth 2.0 flow
- Tokens stored in Supabase with RLS
- Auto-refresh on expiry (if configured)
- Team support (works with personal and team accounts)

### Project Management
- Lists all Vercel projects
- Shows framework (Next.js, React, etc.)
- Displays production domain
- Real-time deployment status

### One-Click Deploy
- Triggers redeploy of latest deployment
- Shows deployment progress
- Polls status every 5 seconds
- Links to Vercel inspector

### Deployment History
- Tracks all deployments in database
- Shows commit info (if GitHub connected)
- Deployment duration metrics
- Filterable by project/date

## 📁 File Structure

```
src/
├── app/api/admin/connections/vercel/
│   ├── callback/
│   │   └── route.ts          # OAuth callback handler
│   ├── projects/
│   │   └── route.ts          # GET projects, DELETE connection
│   └── deploy/
│       └── route.ts          # POST deploy, GET status
├── components/admin/
│   └── ConnectionsPanel.tsx  # UI for connections + projects
└── supabase/migrations/
    └── 20250209_add_connections.sql  # Database schema
```

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - Users only see their own connections
   - Enforced at database level

2. **Token Storage**
   - Encrypted at rest by Supabase
   - Never exposed to client
   - Server-side only access

3. **OAuth Best Practices**
   - State parameter (CSRF protection)
   - Redirect URI validation
   - Token expiry handling

## 🚀 API Routes

### GET /api/admin/connections/vercel/projects
Fetch all projects and latest deployments.

**Response:**
```json
{
  "connected": true,
  "username": "yourname",
  "team_id": "team_xxx",
  "projects": [
    {
      "id": "prj_xxx",
      "name": "my-app",
      "framework": "nextjs",
      "productionDomain": "my-app.vercel.app",
      "latestDeployment": {
        "id": "dpl_xxx",
        "url": "my-app-git-main.vercel.app",
        "state": "READY",
        "readyState": "READY",
        "createdAt": 1234567890,
        "target": "production"
      }
    }
  ],
  "total": 1
}
```

### POST /api/admin/connections/vercel/deploy
Trigger a new deployment.

**Body:**
```json
{
  "projectId": "prj_xxx",
  "target": "production"
}
```

**Response:**
```json
{
  "success": true,
  "deployment": {
    "id": "dpl_xxx",
    "url": "https://my-app-xxx.vercel.app",
    "state": "BUILDING",
    "inspectorUrl": "https://vercel.com/...",
    "target": "production"
  }
}
```

### GET /api/admin/connections/vercel/deploy?deploymentId=xxx
Check deployment status.

**Response:**
```json
{
  "id": "dpl_xxx",
  "url": "https://my-app-xxx.vercel.app",
  "state": "READY",
  "ready": 1234567890,
  "buildingAt": 1234567800,
  "target": "production"
}
```

### DELETE /api/admin/connections/vercel/projects
Disconnect Vercel integration.

**Response:**
```json
{
  "success": true,
  "disconnected": true
}
```

## 🐛 Troubleshooting

### "Vercel not connected" error
- Check environment variables are set
- Verify OAuth callback URL matches exactly
- Check browser console for OAuth errors

### "No deployments found" error
- Project needs at least one previous deployment
- Deploy via Git first, then use one-click deploy
- Vercel must have Git connection configured

### Projects not showing
- Check Vercel API token is valid
- Verify user has access to projects
- Check browser console for fetch errors

### Deployment fails
- Verify project has valid Git connection in Vercel
- Check Vercel dashboard for deployment logs
- Ensure user has deploy permissions

## 📊 Database Schema

### connections table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- service: VARCHAR(50) ('vercel', 'github', etc.)
- access_token: TEXT (encrypted)
- refresh_token: TEXT (encrypted, optional)
- token_expires_at: TIMESTAMPTZ (optional)
- metadata: JSONB (service-specific data)
- connected_at: TIMESTAMPTZ
- last_used_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### deployments table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- connection_id: UUID (references connections)
- vercel_deployment_id: TEXT
- vercel_project_id: TEXT
- project_name: TEXT
- url: TEXT
- state: TEXT ('BUILDING', 'READY', 'ERROR', 'CANCELED')
- commit_sha: TEXT (optional)
- commit_message: TEXT (optional)
- branch: TEXT (optional)
- build_duration_ms: INTEGER (optional)
- created_at: TIMESTAMPTZ
- ready_at: TIMESTAMPTZ (optional)
- metadata: JSONB
```

## 🎯 Future Enhancements

- [ ] Webhook support for real-time updates
- [ ] Environment variable management
- [ ] Custom domain management
- [ ] Team member management
- [ ] Build log viewer
- [ ] Rollback to previous deployment
- [ ] Preview deployment support
- [ ] Deployment comments/notes
- [ ] Analytics integration

## 📚 Resources

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Vercel OAuth Guide](https://vercel.com/docs/integrations)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

Built with 💜 by CubiQo Team

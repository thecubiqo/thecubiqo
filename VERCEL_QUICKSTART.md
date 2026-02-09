# 🚀 Vercel Integration - Quick Start

Get Vercel one-click deployments working in 5 minutes.

## ⚡ Quick Setup

### 1. Create Vercel Integration (2 min)

```bash
# 1. Go to: https://vercel.com/account/integrations
# 2. Click "Create Integration"
# 3. Add redirect URL:
#    - Local: http://localhost:3000/api/admin/connections/vercel/callback
#    - Prod: https://yourdomain.com/api/admin/connections/vercel/callback
# 4. Copy Client ID and Client Secret
```

### 2. Add Environment Variables (1 min)

Add to `.env.local`:

```bash
NEXT_PUBLIC_VERCEL_CLIENT_ID=your_client_id_here
VERCEL_CLIENT_SECRET=your_client_secret_here
```

### 3. Run Database Migration (1 min)

```bash
# Open Supabase SQL Editor: https://app.supabase.com
# Run: supabase/migrations/20250209_add_connections.sql
# Or via CLI:
supabase db push
```

### 4. Test It (1 min)

```bash
npm run dev
# Visit: http://localhost:3000/admin
# Click: "Connect Vercel"
# Authorize and you're done! 🎉
```

## 🎯 What You Get

✅ OAuth connection to Vercel  
✅ List all your projects  
✅ See deployment status  
✅ One-click deploy button  
✅ Real-time deployment tracking  
✅ Deployment history  

## 📁 Files Created

```
✅ src/app/api/admin/connections/vercel/callback/route.ts
✅ src/app/api/admin/connections/vercel/projects/route.ts
✅ src/app/api/admin/connections/vercel/deploy/route.ts
✅ src/components/admin/ConnectionsPanel.tsx (updated)
✅ supabase/migrations/20250209_add_connections.sql
✅ docs/VERCEL_INTEGRATION.md (full docs)
```

## 🐛 Common Issues

**"Vercel not connected"**
→ Check env vars are set and restart dev server

**"No projects showing"**
→ You need at least one project in your Vercel account

**"Deployment failed"**
→ Project must have a Git connection in Vercel first

## 📖 Full Documentation

See `docs/VERCEL_INTEGRATION.md` for:
- Complete API reference
- Security details
- Advanced features
- Troubleshooting guide

---

**Need help?** Check the full docs or create an issue on GitHub.

Built with 💜 by CubiQo

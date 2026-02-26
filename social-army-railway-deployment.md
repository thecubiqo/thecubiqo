# 🚀 SOCIAL ARMY RAILWAY DEPLOYMENT GUIDE

## 📋 OVERVIEW

The **Social Army** is a **separate Node.js service** that needs to be deployed to **Railway** as a long-running process. It's not part of the main Next.js app (which runs on Vercel).

## 🏗️ ARCHITECTURE

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │   Social Army   │    │   Database      │
│   (Next.js)     │────│   (Node.js)     │────│   (Supabase)    │
│   cubiqo.ai     │    │   Railway       │    │                 │
│   Vercel        │    │   Long-running  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                          Shared Environment
                          Variables & Database
```

## 🔧 STEP 1: CREATE RAILWAY PROJECT

### Option A: Deploy from GitHub (Recommended)
1. Go to: https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select repository: **thecubiqo/thecubiqo**
4. Select branch: **main**
5. Railway will detect the `social-army` directory

### Option B: Deploy from CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Link to existing project
railway link

# Deploy
railway up
```

## ⚙️ STEP 2: CONFIGURE ENVIRONMENT VARIABLES

In Railway dashboard, go to your project → **Variables** tab and add:

### Core Configuration
```
SOCIAL_ARMY_STATUS=ON
NODE_ENV=production
```

### GFXToolz Credentials (REQUIRED)
```
GFX_TOOLZ_USER=your_actual_username
GFX_TOOLZ_PASS=your_actual_password
```
**Get from:** https://gfx.toolz/

### Social Media Platform Credentials

#### Twitter/X API v2
```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```
**Get from:** https://developer.twitter.com/

#### LinkedIn API
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
```
**Get from:** https://www.linkedin.com/developers/

#### Instagram API (via Facebook)
```
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_access_token
```
**Get from:** https://developers.facebook.com/

#### TikTok API
```
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_ACCESS_TOKEN=your_access_token
```
**Get from:** https://developers.tiktok.com/

#### YouTube API
```
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token
```
**Get from:** https://console.cloud.google.com/

### Database Connection (Shared with Main App)
```
NEXT_PUBLIC_SUPABASE_URL=https://naoxezcmcauecawchgjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
**Note:** Use the same Supabase keys as your main app.

## 🐳 STEP 3: CONFIGURE RAILWAY SETTINGS

### Service Configuration
1. In Railway, go to **Settings** → **Service**
2. Set **Root Directory** to: `social-army`
3. Set **Build Command** to: `npm install`
4. Set **Start Command** to: `npm start`

### Resource Allocation
- **CPU**: 1 vCPU (minimum)
- **Memory**: 1GB RAM (minimum)
- **Storage**: 1GB (for logs and temp files)

### Health Checks
- **Path**: `/health` (if implemented)
- **Port**: 3000 (default)
- **Timeout**: 30 seconds

## 📦 STEP 4: DEPLOY TO RAILWAY

### Automatic Deployment (GitHub)
Railway will automatically deploy when you push to the `main` branch.

### Manual Deployment
```bash
# Deploy current directory
railway up

# Deploy specific service
railway up social-army

# View logs
railway logs

# Check status
railway status
```

## 🧪 STEP 5: TEST THE DEPLOYMENT

### Check Deployment Status
1. Go to Railway dashboard → **Deployments**
2. Check if deployment succeeded
3. View logs for any errors

### Test Social Army Endpoints
```bash
# Check if service is running
curl https://your-railway-app.up.railway.app/health

# Check logs
railway logs --tail 100
```

### Test from Main App
1. Go to: https://cubiqo.ai/admin/social-army
2. Turn on Social Army: `SOCIAL_ARMY_STATUS=ON`
3. Test content generation
4. Test posting to platforms

## 🔍 STEP 6: MONITORING & MAINTENANCE

### Railway Dashboard
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status

### Health Checks
Create a simple health endpoint in `social-army/src/health.ts`:
```typescript
import express from 'express';
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
```

### Logging
Railway provides built-in logging. Check:
- Application logs
- Build logs
- Runtime errors

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

#### 1. Build Fails
```
Error: Cannot find module
```
**Solution:** Ensure `package.json` has all dependencies listed.

#### 2. Service Crashes on Startup
```
Error: Missing environment variables
```
**Solution:** Check all required environment variables are set in Railway.

#### 3. Database Connection Fails
```
Error: supabaseUrl is required
```
**Solution:** Verify Supabase environment variables are correct.

#### 4. Puppeteer Fails (Headless Browser)
```
Error: Failed to launch browser
```
**Solution:** Railway might need Puppeteer configuration. Add to `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm rebuild puppeteer",
    "startCommand": "npm start"
  }
}
```

#### 5. Memory Issues
```
Error: JavaScript heap out of memory
```
**Solution:** Increase memory allocation in Railway settings.

## 📊 STEP 7: OPTIMIZE & SCALE

### Performance Optimization
1. **Enable Caching**: Cache API responses
2. **Queue System**: Use Redis for job queuing
3. **Database Indexing**: Optimize Supabase queries

### Scaling
1. **Horizontal Scaling**: Add more replicas in Railway
2. **Vertical Scaling**: Increase CPU/Memory allocation
3. **Database Scaling**: Upgrade Supabase plan if needed

### Cost Optimization
- Start with smallest instance ($5/month)
- Monitor usage and scale as needed
- Use Railway's free tier for testing

## 🔗 INTEGRATION WITH MAIN APP

### Environment Variables Sync
Keep these variables in sync between Vercel and Railway:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Schema
Social Army uses the same Supabase database. Ensure tables exist:
```sql
-- Check if Social Army tables exist
SELECT * FROM social_army_posts;
SELECT * FROM social_army_schedules;
SELECT * FROM social_army_analytics;
```

### API Integration
Main app can control Social Army via:
1. Database flags
2. REST API endpoints
3. Webhook notifications

## 🎯 DEPLOYMENT CHECKLIST

- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Root directory set to `social-army`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Deployment succeeded
- [ ] Health check passes
- [ ] Social Army dashboard accessible
- [ ] Content generation works
- [ ] Platform posting works
- [ ] Monitoring configured

## ⏱️ ESTIMATED TIMELINE

- **Setup**: 1-2 hours (getting API credentials)
- **Deployment**: 30 minutes
- **Testing**: 1-2 hours
- **Total**: 3-5 hours

## 📞 SUPPORT

### Railway Support
- Documentation: https://docs.railway.app/
- Discord: https://discord.gg/railway
- Twitter: @railway

### CubiQo Support
- Documentation: https://docs.cubiqo.ai/
- GitHub: https://github.com/thecubiqo/thecubiqo
- Email: support@cubiqo.ai

## 🎉 SUCCESS METRICS

- ✅ Social Army service running 24/7
- ✅ Content generated automatically
- ✅ Posts published to all platforms
- ✅ Analytics collected
- ✅ Integration with main app working
- ✅ Cost under $20/month

---

**Last Updated:** 2026-02-25  
**Deployment Status:** Ready for Railway deployment  
**Next Action:** Create Railway project and configure environment variables
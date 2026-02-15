# CubiQo Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Vercel Account & CLI
```bash
npm i -g vercel
vercel login
```

### 2. Create Two Projects in Vercel Dashboard
- **Project A:** `cubiqo-admin` → domain: admin.cubiqo.com
- **Project B:** `cubiqo-public` → domain: cubiqo.com

### 3. Configure Environment Variables in Vercel

#### Prod-A (Admin) - cubiqo-admin project:
```
NEXT_PUBLIC_USE_EMERGENT=true
EMERGENT_API_URL=https://integrations.emergentagent.com/llm
EMERGENT_API_KEY=sk-emergent-936E79916C0DbB0396
ANTHROPIC_API_KEY=emergent
OPENAI_API_KEY=emergent
ELEVENLABS_API_KEY=emergent
NEXT_PUBLIC_ADMIN_MODE=true
NEXT_PUBLIC_SHOW_API_MANAGEMENT=true
NEXT_PUBLIC_SHOW_ANALYTICS=true
NEXT_PUBLIC_SHOW_USER_MANAGEMENT=true
DATABASE_URL=[REAL_SUPABASE_URL]
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://admin.cubiqo.com
```

#### Prod-B (Public) - cubiqo-public project:
```
NEXT_PUBLIC_USE_EMERGENT=false
NEXT_PUBLIC_BYO_KEYS_MODE=true
NEXT_PUBLIC_ADMIN_MODE=false
NEXT_PUBLIC_RATE_LIMIT_ENABLED=true
NEXT_PUBLIC_MAX_REQUESTS_PER_HOUR=100
NEXT_PUBLIC_MAX_SPENDING_PER_DAY=10
DATABASE_URL=[REAL_SUPABASE_URL]
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://cubiqo.com
```

### 4. Deploy from Production Branch

#### Deploy Prod-A:
```bash
cd /root/clawd/thecubiqo
git checkout production
vercel --prod --name cubiqo-admin
```

#### Deploy Prod-B:
```bash
vercel --prod --name cubiqo-public
```

### 5. Configure Domains in Vercel
- Project A: Add custom domain `admin.cubiqo.com`
- Project B: Add custom domain `cubiqo.com`

### 6. Post-Deployment Testing
- [ ] Visit admin.cubiqo.com - should load admin interface
- [ ] Visit cubiqo.com - should load public interface
- [ ] Test voice interaction
- [ ] Test cube visualization
- [ ] Test AI responses
- [ ] Verify analytics tracking

## Rollback Plan
If issues occur:
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

## Success Criteria
- ✅ Both sites load without errors
- ✅ SSL certificates active
- ✅ Voice + AI interaction works
- ✅ Cube visualization renders
- ✅ Admin features accessible (Prod-A only)
- ✅ Rate limiting works (Prod-B)

---
**Status:** Ready for deployment
**Production Branch:** `origin/production`
**Tag:** `v1.0.0-prod`

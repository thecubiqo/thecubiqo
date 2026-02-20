# WHERE IS THE STAGING DATABASE?

**Question:** "where is the staging DB?"

**Quick Answer:** The staging database doesn't exist yet - you need to create it first!

---

## 🎯 Current Status

The staging database infrastructure is **ready to use**, but the actual Supabase staging database **has not been created yet**.

### What Exists:
✅ Setup scripts and automation  
✅ Documentation and guides  
✅ Configuration templates  
✅ Health monitoring endpoints  

### What Doesn't Exist Yet:
❌ The actual Supabase staging project  
❌ Staging database credentials  
❌ Deployed staging environment  

---

## 📍 Where to Create the Staging Database

### Step 1: Go to Supabase
**URL:** https://supabase.com

### Step 2: Create New Project
Click **"New Project"** and enter:
- **Name:** `cubiqo-staging`
- **Database Password:** [generate strong password]
- **Region:** Choose same as production (for consistency)
- **Plan:** Free tier is sufficient for staging

### Step 3: Wait for Provisioning
It takes ~2 minutes for Supabase to create your project.

### Step 4: Get Credentials
Once ready, go to **Project Settings → API** and copy:
- **Project URL** (e.g., `https://abcdefgh123.supabase.co`)
- **anon key** (public key)
- **service_role key** (secret key - keep secure!)

---

## 📝 Where to Store the Credentials

### Option 1: Local Development (.env.staging)

Create a file called `.env.staging` in the project root:

```bash
# Create the file
cat > .env.staging << 'EOF'
# Staging Database Configuration
NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key-here
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-role-key-here
NODE_ENV=staging
EOF
```

**Note:** This file is gitignored and won't be committed to the repository.

### Option 2: Vercel Deployment (Environment Variables)

For deploying staging to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL_STAGING`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
   - `SUPABASE_SERVICE_ROLE_KEY_STAGING`
   - `NODE_ENV=staging`

---

## 🗺️ Where Is Everything Located?

### In the Repository

```
thecubiqo/
├── .env.example                    ← Template with staging variables
├── .env.staging                    ← YOUR CREDENTIALS (not in git)
│
├── Documentation/
│   ├── STAGING_DATABASE_SETUP.md   ← Complete setup guide
│   ├── STAGING_QUICK_REF.md        ← Quick reference
│   ├── STAGING_SETUP_TUTORIAL.md   ← Step-by-step tutorial
│   ├── STAGING_TESTING_HANDOFF.md  ← Team testing guide
│   ├── STAGING_BRIEF.md            ← Executive summary
│   └── WHERE_IS_STAGING_DB.md      ← This file!
│
├── scripts/
│   └── setup-staging-db.sh         ← Automation script
│
├── package.json                    ← npm staging commands
└── src/app/api/health/route.ts     ← Health check with staging support
```

### On Supabase (Once Created)

**Dashboard URL:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID

You'll find:
- **Project Settings** → API credentials
- **Database** → Tables and schemas
- **SQL Editor** → Run migrations
- **Table Editor** → View data
- **Authentication** → User management

### Environment Resolution

The application checks for staging database in this order:

1. `NEXT_PUBLIC_SUPABASE_URL_STAGING` (staging-specific)
2. `NEXT_PUBLIC_SUPABASE_URL` (falls back to default)
3. Error if neither exists

---

## 🚀 How to Set Up the Staging Database

### Quick Setup (15 minutes)

```bash
# 1. Create Supabase project at https://supabase.com
# 2. Copy credentials to .env.staging
# 3. Run these commands:

npm run staging:init      # Verify credentials
npm run staging:migrate   # Apply all migrations
npm run staging:verify    # Confirm everything works

# ✅ Done! Your staging database is now ready
```

### Detailed Instructions

See **STAGING_DATABASE_SETUP.md** for complete step-by-step instructions.

---

## 🔍 How to Check Where Staging Is Pointing

### Check Environment Variables

```bash
# Show staging URL (if configured)
grep STAGING .env.staging 2>/dev/null || echo "Not configured yet"

# Or check with script
npm run staging:init
```

### Check Health Endpoint

```bash
# Start dev server
npm run dev

# In another terminal, check staging health
curl http://localhost:3000/api/health?env=staging

# Response will show:
# {
#   "status": "healthy",
#   "environment": "staging",
#   "staging_mode": true,
#   "checks": {
#     "supabase": "ok" or "not_configured"
#   }
# }
```

---

## ❓ Common Questions

### Q: Is there already a staging database?
**A:** No, you need to create it first. Follow the setup guide.

### Q: Where are the staging credentials?
**A:** They're not in the repo (for security). You need to:
1. Create the Supabase project
2. Copy credentials to `.env.staging`

### Q: Can I use the same database for dev and staging?
**A:** Not recommended! Staging should be separate to prevent conflicts.

### Q: Where is the staging database hosted?
**A:** On Supabase cloud (https://supabase.com). You choose the region.

### Q: How do I access the staging database?
**A:** Through the Supabase dashboard or via the configured environment variables in your app.

### Q: Is staging deployed anywhere?
**A:** Not yet - you need to deploy to Vercel or another platform after setup.

---

## 📊 Summary Table

| Item | Location | Status |
|------|----------|--------|
| **Staging Infrastructure** | This repository | ✅ Ready |
| **Documentation** | `STAGING_*.md` files | ✅ Complete |
| **Setup Scripts** | `scripts/setup-staging-db.sh` | ✅ Working |
| **Supabase Project** | https://supabase.com | ❌ **Not created yet** |
| **Database Credentials** | `.env.staging` | ❌ **Not configured yet** |
| **Deployed Staging App** | Vercel/hosting | ❌ **Not deployed yet** |

---

## 🎯 Next Steps

### To Answer "Where is the staging DB?":

**Right now:** Nowhere - it doesn't exist yet!

**To create it:**

1. **Go to:** https://supabase.com
2. **Create:** New project called "cubiqo-staging"
3. **Configure:** Copy credentials to `.env.staging`
4. **Run:** `npm run staging:init && npm run staging:migrate`
5. **Verify:** `npm run staging:verify`

**After setup:** Your staging database will be at:
- **URL:** `https://[your-project-id].supabase.co`
- **Dashboard:** `https://supabase.com/dashboard/project/[your-project-id]`

---

## 📞 Need Help?

### Quick Start Guide
Read: **STAGING_QUICK_REF.md**

### Complete Setup Instructions
Read: **STAGING_DATABASE_SETUP.md**

### Step-by-Step Tutorial
Read: **STAGING_SETUP_TUTORIAL.md**

---

**TL;DR:** The staging database doesn't exist yet. Create it at https://supabase.com, then configure `.env.staging` with the credentials. Run `npm run staging:init` to get started.

**Created:** 2026-02-17  
**Status:** Documentation complete, database creation pending

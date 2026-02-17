# DEPLOYMENT GUIDE - staging0217 Branch

## 🎯 Answers to Your Questions

### 1. Which branch are you implementing these changes in?

**Answer:** I've implemented the CUBIQO flagship features in **TWO branches**:

- **`copilot/implement-cubiqo-features`** - Initial development branch (where all the work was done)
- **`staging0217`** - **FINAL STAGING BRANCH** ✅ (where changes are now merged and ready)

**All changes have been merged into `staging0217` branch** as of commit `[merge commit]`.

---

### 2. Which branch will these changes flow automatically to production/staging0217?

**Answer:** The changes are **NOW IN `staging0217`** ✅

**Branch Flow:**
```
copilot/implement-cubiqo-features (dev work)
          ↓
   staging0217 (staging environment) ← YOU ARE HERE ✅
          ↓
     production (when ready to deploy)
```

**Automatic Deployment (Vercel):**
- When you push to `staging0217`, Vercel will **automatically create a preview deployment**
- This preview is **separate from production**
- You can view it at a unique URL provided by Vercel

**Important:** `staging0217` does NOT automatically flow to production. You control when to promote from staging to production.

---

### 3. Where and how to view in Vercel?

**Answer:** To view your changes in Vercel:

#### **Option A: Via GitHub (Recommended)**
1. Go to GitHub: https://github.com/thecubiqo/thecubiqo
2. Click on **"Pull Requests"** or **"Branches"**
3. Find the `staging0217` branch
4. Vercel will automatically add a comment with the preview URL (looks like: `staging0217-thecubiqo.vercel.app` or similar)

#### **Option B: Via Vercel Dashboard**
1. Log in to Vercel: https://vercel.com
2. Go to your project: **thecubiqo**
3. Click on **"Deployments"** tab
4. Look for deployments from branch: `staging0217`
5. Click on any deployment to see the preview URL
6. Preview URL format: `staging0217-thecubiqo-[hash].vercel.app`

#### **Option C: Direct Link (After Push)**
After pushing to `staging0217`, Vercel will:
1. Automatically detect the push
2. Start building the preview
3. Post a comment on GitHub with the link
4. Send you an email (if configured)

**Typical preview URL structure:**
```
https://thecubiqo-[branch-name]-[hash].vercel.app
OR
https://staging0217-thecubiqo.vercel.app
```

---

## 📋 What's in staging0217 Now?

### **Sprint 1 Features (COMPLETE):**

✅ **Database (Guy - 2 days)**
- Browser sessions table
- Browser actions audit log
- Consent records table
- 12 indexes, 7 RLS policies

✅ **Backend (Blossom - 6 days)**
- BYO API keys with AES-GCM encryption
- Browser automation queue (max 5 concurrent)
- Browser automation pool (instance reuse)
- 10 API endpoints (`/api/byo`, `/api/browser/*`)
- Consent manager with domain tracking
- Rate limiting (10 sessions/hour)

✅ **Frontend (Bubbles - 3 days)**
- Voice state UI (idle/listening/thinking/speaking)
- Browser consent dialog
- Enhanced BYO settings with validation
- Test Connection button
- Mobile responsive, WCAG 2.1 AA accessible

✅ **Documentation**
- START_HERE_MO_REVIEW.md
- TECHNICAL_ARCHITECTURE_REVIEW.md
- SPRINT_1_IMPLEMENTATION_PLAN.md
- Complete backend, frontend, database docs

---

## 🚀 How to Deploy to Vercel Preview

### **Automatic Deployment (Already Happening):**

I've already pushed to `staging0217`, so Vercel should be building now!

### **Manual Check:**

```bash
# Check the push was successful
git log staging0217 --oneline -5

# Verify remote is updated
git ls-remote origin staging0217
```

### **Force Redeploy (if needed):**

If Vercel didn't automatically deploy:

1. **Via Vercel Dashboard:**
   - Go to Vercel project
   - Click "Redeploy" on the latest `staging0217` deployment

2. **Via Git (empty commit):**
   ```bash
   git checkout staging0217
   git commit --allow-empty -m "trigger: Force Vercel redeploy"
   git push origin staging0217
   ```

---

## 🔐 Environment Variables Required

Before the preview works fully, ensure these are set in Vercel:

### **Critical (Required):**
```env
BYO_ENCRYPTION_SECRET=<32-byte-random-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### **Optional (for features):**
```env
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

### **How to Set in Vercel:**
1. Go to Vercel project settings
2. Click "Environment Variables"
3. Add variables for "Preview" environment
4. Select branch: `staging0217`
5. Save and redeploy

---

## ✅ Verification Checklist

### **After Vercel Preview is Live:**

- [ ] Visit the Vercel preview URL
- [ ] Check homepage loads without errors
- [ ] Test voice state UI (idle → listening → thinking → speaking)
- [ ] Try BYO settings page (add fake API key, test validation)
- [ ] Check browser console for errors (should be minimal)
- [ ] Verify mobile responsiveness
- [ ] Test database migrations ran (check Supabase for new tables)

### **Database Migration:**

The following tables should exist in Supabase:
- `browser_sessions`
- `browser_actions`
- `browser_consent_records`

**To verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'browser_%';
```

---

## 📞 Next Steps

### **For You:**

1. **View the Preview:**
   - Check Vercel dashboard for `staging0217` deployment
   - Get the preview URL
   - Share with team for testing

2. **Test the Features:**
   - Try BYO mode (Settings → API Keys)
   - Test voice state UI (click microphone)
   - Verify consent dialog appears for browser actions

3. **Set Environment Variables:**
   - Add `BYO_ENCRYPTION_SECRET` to Vercel
   - Verify Supabase credentials are set

4. **When Ready for Production:**
   - Merge `staging0217` → `main` (or `production` branch)
   - Vercel will auto-deploy to production domain

### **For the Team:**

- **Buttercup (QA):** Run tests on the staging preview
- **Pushpa (UI/UX):** Review animations and design polish
- **Mo (CTO):** Code review and approve for production

---

## 🎨 Vercel Preview Features

**What you get with staging0217 preview:**

✅ **Separate Environment** - Doesn't affect production  
✅ **Unique URL** - Shareable with team  
✅ **Automatic Builds** - Every push to `staging0217` triggers rebuild  
✅ **Branch Protection** - Production stays stable  
✅ **Comments on PRs** - If you create a PR, Vercel posts preview link  

---

## 📊 Summary

| Question | Answer |
|----------|--------|
| **1. Which branch?** | `staging0217` ✅ (merged from `copilot/implement-cubiqo-features`) |
| **2. Flow to production?** | NO - Manual promotion when ready ✅ |
| **3. View in Vercel?** | Vercel dashboard → Deployments → `staging0217` preview URL ✅ |

---

## 🔗 Quick Links

- **GitHub Repo:** https://github.com/thecubiqo/thecubiqo
- **Vercel Dashboard:** https://vercel.com/thecubiqo
- **Branch:** `staging0217`
- **Preview URL:** Check Vercel dashboard or GitHub PR comments

---

**Status:** ✅ All changes are in `staging0217` and ready for Vercel preview!

**Next Action:** Check Vercel dashboard for the preview URL and share with your team for testing!

---

*Generated: 2026-02-17*  
*Branch: staging0217*  
*Commit: [merge commit]*

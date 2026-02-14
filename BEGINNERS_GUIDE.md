# Complete Beginner's Guide to Git, Vercel, and Supabase 🚀

Welcome! This guide explains everything step-by-step for beginners.

---

## 📖 Table of Contents

1. [Understanding the 27 Pages](#understanding-the-27-pages)
2. [Understanding Branches](#understanding-branches)
3. [How to Test Locally](#how-to-test-locally)
4. [How to Push to GitHub](#how-to-push-to-github)
5. [How Vercel Deployment Works](#how-vercel-deployment-works)
6. [Understanding Supabase](#understanding-supabase)
7. [Quick Reference Commands](#quick-reference-commands)

---

## 1. Understanding the 27 Pages

### What are "pages"?

Think of pages like different rooms in your house. Each page is a different screen users can visit on your website.

### Your Website's Pages:

| Page | URL | What It Does |
|------|-----|--------------|
| Homepage | `www.cubiqo.ai` | Landing page visitors see first |
| Chat | `www.cubiqo.ai/chat` | Where users chat with AI agents |
| Admin | `www.cubiqo.ai/admin` | Your control panel (admin only) |
| Agents | `www.cubiqo.ai/agents` | View all AI agents |
| Files | `www.cubiqo.ai/files` | File management |
| Auth Error | `www.cubiqo.ai/auth/error` | Shown when login fails |
| Settings | `www.cubiqo.ai/settings-cube` | App settings |

### Why 27 pages if only 10 page files?

Next.js (your framework) creates multiple versions:
- **Static pages** (pre-built HTML)
- **Dynamic routes** (pages with variables like `/region/us`)
- **API endpoints** (backend routes like `/api/chat`)
- **Error pages** (404, 500, etc.)
- **Loading states** (what shows while page loads)

**Example:**
```
src/app/page.tsx → Generates:
  - /                    (homepage)
  - / (client bundle)    (JavaScript for interactivity)
  - / (loading state)    (what shows while loading)
```

Total: **27 compiled pages** including all variants! ✅

---

## 2. Understanding Branches

### What is a Branch?

Think of Git branches like parallel universes of your code:

```
main branch (Universe A)
  └─ Has auto-commits, some bugs

production branch (Universe B)
  └─ Has 32 features, working code

copilot/debug-code-issues (Universe C)
  └─ Has fixes for auth, build problems

the-merger (Universe D) ⭐ BEST
  └─ Combines production + fixes = ULTIMATE!
```

### Current Branch Status:

| Branch | Status | Location |
|--------|--------|----------|
| `main` | ❌ Broken (deployed) | GitHub + Vercel |
| `production` | ✅ Good features | GitHub only |
| `copilot/debug-code-issues` | ✅ Has fixes | GitHub + Here |
| `the-merger` | ⚠️ Being created | Not yet on GitHub |

---

## 3. How to Test Locally

### What Does "Test Locally" Mean?

Testing on YOUR computer before putting code on the internet.

### Prerequisites:

Make sure you have installed:
- ✅ Node.js (version 18 or higher)
- ✅ npm (comes with Node.js)
- ✅ Git

### Step-by-Step Testing:

#### Option 1: Test Current Branch (Easiest)

```bash
# 1. Open Terminal (Mac) or Command Prompt (Windows)
cd /path/to/your/project

# 2. Check which branch you're on
git branch

# 3. Install dependencies (first time only)
npm install

# 4. Run the development server
npm run dev

# 5. Open browser and go to:
http://localhost:3000
```

**What you'll see:**
- Your website running on your computer
- Changes update instantly as you edit code
- No internet needed!

#### Option 2: Test the-merger Branch

```bash
# 1. Switch to the-merger branch
git checkout the-merger

# 2. Install dependencies (in case they changed)
npm install

# 3. Build the project (checks for errors)
npm run build

# 4. Start production server
npm start

# 5. Open browser:
http://localhost:3000
```

**What "npm run build" does:**
- Compiles all TypeScript to JavaScript
- Optimizes images and assets
- Generates static pages
- Checks for errors
- Creates production-ready code

**Success looks like:**
```
✓ Compiled successfully in 8.2s
✓ Route (pages)                        Size     First Load JS
✓ ○ /                                 1.2 kB         100 kB
✓ ○ /admin                            800 B          99 kB
✓ ○ /chat                             1.5 kB         101 kB
... (more pages listed)
✓ λ /api/chat                         0 B            0 B
```

---

## 4. How to Push to GitHub

### What is "Pushing"?

Pushing = Uploading your code from your computer to GitHub (cloud storage for code).

### Before You Push:

Check what changed:
```bash
# See which files changed
git status

# See exactly what changed in files
git diff
```

### Step-by-Step Push:

```bash
# 1. Add all changes to staging
git add .

# 2. Commit with a message (save point)
git commit -m "Description of what you changed"

# 3. Push to GitHub
git push origin branch-name

# Example for the-merger branch:
git push origin the-merger
```

### If You Get Errors:

**Error: "Permission denied"**
```bash
# Solution: Set up GitHub authentication
# Use GitHub Desktop app (easiest for beginners)
# OR generate a Personal Access Token
```

**Error: "Branch doesn't exist on remote"**
```bash
# Solution: Create branch on GitHub first
git push -u origin branch-name
```

### After Pushing:

1. Go to GitHub: https://github.com/thecubiqo/thecubiqo
2. You'll see your branch in the branches dropdown
3. GitHub may prompt you to create a Pull Request

---

## 5. How Vercel Deployment Works

### What is Vercel?

Vercel = A service that:
- Hosts your website on the internet
- Automatically builds and deploys when you push code
- Gives you URLs to preview changes

### How It Works (Automatic! 🎉):

```
You push code → GitHub receives it → Vercel detects change
→ Vercel builds your app → Vercel deploys to internet
→ You get a URL to visit!
```

### Vercel Deployment Types:

#### Production Deployment:
- **Trigger:** Push to `main` branch
- **URL:** `www.cubiqo.ai` (your main domain)
- **Purpose:** Live site users see

#### Preview Deployment:
- **Trigger:** Push to ANY other branch
- **URL:** `branch-name.vercel.app`
- **Purpose:** Test before making live

### Accessing Your Deployments:

1. **Via Vercel Dashboard:**
   - Go to: https://vercel.com
   - Log in
   - Click on your project
   - See all deployments

2. **Via GitHub:**
   - Go to your Pull Request
   - Look for "Vercel bot" comment
   - Click the preview link

### Example URLs:

```
main branch:
→ www.cubiqo.ai (production)

the-merger branch:
→ the-merger-cubiqo.vercel.app (preview)

copilot/debug-code-issues:
→ copilot-debug-code-issues-cubiqo.vercel.app (preview)
```

### What Happens During Deployment:

```
1. [Building...] Vercel runs: npm install, npm run build
2. [Optimizing...] Compresses images, minifies code
3. [Deploying...] Uploads to CDN (fast servers worldwide)
4. [Ready!] ✅ Your site is live!
```

**Build time:** Usually 1-3 minutes

---

## 6. Understanding Supabase

### What is Supabase?

Supabase = Your database + authentication service.

Think of it as:
- **Database:** Like Excel spreadsheets in the cloud
- **Auth:** Handles user login/signup
- **Storage:** Stores user files

### How Your App Uses Supabase:

```
User logs in → Your app talks to Supabase → Supabase checks password
→ If correct, creates session → User is logged in! ✅
```

### Supabase Dashboard:

**URL:** https://supabase.com/dashboard

**What you can do:**
- View your database tables
- See users who signed up
- Run SQL queries
- Check API usage
- Manage authentication

### Your Database Tables:

| Table | What It Stores |
|-------|----------------|
| `profiles` | User information (name, email, etc.) |
| `sessions` | Active user sessions |
| `conversations` | Chat histories |
| `messages` | Individual chat messages |
| `memory` | AI agent memory/context |
| `events` | System events/logs |
| `agents` | AI agent configurations |
| `code_executions` | Code run by agents |

### Connecting Supabase to Your App:

In `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
1. Go to Supabase Dashboard
2. Click your project
3. Go to Settings → API
4. Copy the values

---

## 7. Quick Reference Commands

### Essential Git Commands:

```bash
# See current branch
git branch

# Switch branches
git checkout branch-name

# Create new branch
git checkout -b new-branch-name

# See what changed
git status
git diff

# Save changes
git add .
git commit -m "Your message"

# Upload to GitHub
git push origin branch-name

# Download latest from GitHub
git pull origin branch-name

# See commit history
git log --oneline -10
```

### Essential npm Commands:

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter (check code quality)
npm run lint

# Run tests (if available)
npm test

# Check for security vulnerabilities
npm audit
```

### Essential Vercel Commands (Optional):

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# See deployments
vercel list
```

---

## 🎯 Your Action Items (Simplified)

### Immediate (Do Today):

1. **Review the-merger branch**
   - Wait for me to push it to GitHub
   - I'll give you a link to review

2. **Test in Vercel Preview**
   - Wait for automatic deployment
   - Click the preview link I provide
   - Test the website

3. **Check if everything works**
   - Try logging in
   - Test chat feature
   - Check admin panel

### Short Term (This Week):

4. **Set up Supabase**
   - Follow Supabase setup guide
   - Run database migrations
   - Configure environment variables

5. **Deploy to Production**
   - After testing preview
   - Merge the-merger → main
   - Vercel auto-deploys to www.cubiqo.ai

---

## 🆘 Getting Help

### If Something Breaks:

1. **Check Build Logs:**
   - Vercel dashboard → Deployments → Click deployment → View logs
   - Look for red error messages

2. **Check Browser Console:**
   - Open website
   - Press F12 (Windows) or Cmd+Option+I (Mac)
   - Look for red errors

3. **Common Issues:**

**"Module not found"**
```bash
# Solution: Install dependencies
npm install
```

**"Port 3000 already in use"**
```bash
# Solution: Kill the process
# Mac/Linux:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID [process_id] /F
```

**"Permission denied" when pushing**
```bash
# Solution: Set up Git credentials
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## 📚 Learning Resources

**Git Basics:**
- https://try.github.io/ (Interactive tutorial)
- https://www.youtube.com/watch?v=HVsySz-h9r4 (Video: Git in 15 minutes)

**Next.js:**
- https://nextjs.org/learn (Official tutorial)
- https://www.youtube.com/watch?v=Sklc_fQBmcs (Video: Next.js for beginners)

**Vercel:**
- https://vercel.com/docs (Official docs)
- https://www.youtube.com/watch?v=2HBIzEx6IZA (Video: Deploy with Vercel)

**Supabase:**
- https://supabase.com/docs (Official docs)
- https://www.youtube.com/watch?v=7uKQBl9uZ00 (Video: Supabase tutorial)

---

## ✅ Checklist for Success

Before going live, verify:

- [ ] Local build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Supabase configured with correct keys
- [ ] Environment variables set in Vercel
- [ ] Preview deployment works
- [ ] Authentication works (login/logout)
- [ ] Chat functionality works
- [ ] Admin panel accessible
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)

---

**Remember:** Everyone was a beginner once! Take your time, test thoroughly, and don't hesitate to ask questions. 🚀

**Next:** Let me create the-merger branch and push it to GitHub so you can see it!

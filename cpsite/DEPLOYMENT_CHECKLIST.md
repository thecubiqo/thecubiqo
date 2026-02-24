# Carl Phillips Personal Website - Deployment Checklist

## ✅ Pre-Deployment Validation

### 1. Installation & Build Test
```bash
cd /home/runner/work/thecubiqo/thecubiqo/cpsite
npm install
npm run build
```

**Expected:** Clean build with no TypeScript errors

### 2. Required Assets

#### Hero Image (Critical)
- [ ] Add `creature.png` to `/public/hero/`
  - Recommended: 1200×1200px PNG with transparency
  - The 3D scene will fail gracefully without it (shows black background)

#### Life Photos
- [ ] Add photos to `/public/images/life/zambia/`
- [ ] Add photos to `/public/images/life/nyc/`
- [ ] Add photos to `/public/images/life/moments/`

#### Work Photos
- [ ] Add photos to `/public/images/work/irc/`
- [ ] Add photos to `/public/images/work/peace-corps/`

### 3. Content

#### Blog Posts
Create MDX files in `/content/posts/` with this format:

```mdx
---
title: "Your Post Title"
date: "2026-02-15"
category: "writing"
slug: "your-post-title"
excerpt: "Brief summary shown in lists"
location: "New York"
image: "/images/posts/your-image.jpg"
tags: ["tag1", "tag2"]
---

# Your Content Here

Write in Markdown/MDX format...
```

**Categories:**
- `writing` → Shows in `/lifes-work/writing`
- `field-notes` → Shows in `/lifes-work/field-notes`

### 4. Configuration

#### Environment Variables (Optional)
Create `.env.local`:

```bash
# Site URL (for SEO)
NEXT_PUBLIC_SITE_URL=https://carlphillips.com

# Social API Tokens (optional, for live social feed)
LINKEDIN_ACCESS_TOKEN=your_token_here
FACEBOOK_PAGE_TOKEN=your_token_here
INSTAGRAM_ACCESS_TOKEN=your_token_here
TWITTER_BEARER_TOKEN=your_token_here
```

### 5. Deployment Options

#### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

**Vercel Config (automatic):**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### Option B: Netlify
```bash
# Create netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

#### Option C: Self-Hosted
```bash
npm run build
npm start
```

Requires Node.js 20+ runtime.

### 6. Performance Optimization

#### Image Optimization
- [ ] Compress images before uploading (TinyPNG, Squoosh)
- [ ] Use WebP format when possible
- [ ] Hero image should be under 500KB

#### Lighthouse Targets
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### 7. Testing Checklist

#### Desktop
- [ ] Home page loads with hero animation
- [ ] Navigation works (all links)
- [ ] Life → Places shows photo galleries
- [ ] Life → Moments shows masonry grid
- [ ] Work page displays roles correctly
- [ ] Life's Work → Writing lists posts
- [ ] Individual post pages render correctly
- [ ] Contact page shows email + socials
- [ ] Admin pages load (no auth yet)

#### Mobile (< 768px)
- [ ] Hero is readable and button works
- [ ] Navigation collapses properly
- [ ] Photo galleries stack vertically
- [ ] Typography is legible
- [ ] Touch targets are 44×44px minimum

#### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if possible)

### 8. SEO Setup

#### Update metadata in `src/lib/seo/metadata.ts`:
```typescript
const BASE_URL = 'https://carlphillips.com'; // Your actual domain
```

#### Add to `public/`:
- [ ] `favicon.ico`
- [ ] `robots.txt`
- [ ] `sitemap.xml`

Example `robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://carlphillips.com/sitemap.xml
```

### 9. Security

#### Admin Routes
Currently unprotected. To add auth:

1. Install auth library:
   ```bash
   npm install next-auth
   ```

2. Protect `/admin` routes with middleware

3. Or use Vercel Password Protection

### 10. Analytics (Optional)

Add to `src/app/layout.tsx`:

```typescript
// Google Analytics
<Script src="https://www.googletagmanager.com/gtag/js?id=GA_ID" />
<Script id="google-analytics">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
  `}
</Script>
```

---

## 🚀 Launch Command

```bash
# Verify everything works locally
npm run dev

# Build for production
npm run build

# Test production build
npm start

# Deploy to Vercel
vercel --prod
```

---

## 📞 Support

Built with Next.js 15 + React 19 + TypeScript

**Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4
- Framer Motion 12
- React Three Fiber 9
- Three.js 0.181

**Structure:**
- Standalone application
- No database required (filesystem-based posts)
- Static generation for all routes
- Optional ISR for dynamic content

---

**Ready for Production** ✅

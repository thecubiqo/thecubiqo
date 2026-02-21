# How to Preview CubiQo

## 🚀 Direct Links (No Setup Required)

### Vercel Preview (live right now)
| Page | Link |
|---|---|
| **Frontend preview** | https://cubiqo-repo-git-copilot-preview-16de32-cubiqo-projects-d7156840.vercel.app/preview |
| **Hero WebGL** | https://cubiqo-repo-git-copilot-preview-16de32-cubiqo-projects-d7156840.vercel.app/hero-webgl-preview |
| **Neon Glass Cube** | https://cubiqo-repo-git-copilot-preview-16de32-cubiqo-projects-d7156840.vercel.app/neon-cube-preview |
| **All previews hub** | https://cubiqo-repo-git-copilot-preview-16de32-cubiqo-projects-d7156840.vercel.app/previews |

### Local (after `npm run dev`)
| Page | Link |
|---|---|
| **Frontend preview** | http://localhost:3000/preview |
| **Hero WebGL** | http://localhost:3000/hero-webgl-preview |
| **Neon Glass Cube** | http://localhost:3000/neon-cube-preview |
| **All previews hub** | http://localhost:3000/previews |

---

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/thecubiqo/thecubiqo.git
   cd thecubiqo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your keys:
   ```bash
   # Required for auth
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Required for AI features
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## Preview Modes

### Standard Preview
Default experience with full functionality enabled.

```bash
npm run dev
```

### Experimental Features
Enable experimental UI features:

```bash
# .env.local
NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER=true
NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME=true
```

### Admin Mode
Enable admin controls (auto-enabled in development):

```bash
# .env.local
NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS=true
```

### OpenClaw Provider (Optional)
Enable optional AI provider:

```bash
# .env.local
OPENCLAW_API_KEY=your_openclaw_key
NEXT_PUBLIC_ENABLE_OPENCLAW=true
```

See [OPENCLAW_INTEGRATION.md](./docs/OPENCLAW_INTEGRATION.md) for details.

---

## Vercel Deployment Preview

### Deploy to Vercel

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure environment variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Separate variables for Development, Preview, and Production

3. **Deploy**
   - Push to your branch
   - Vercel automatically creates a preview deployment
   - Preview URL: `https://your-project-git-branch.vercel.app`

### Preview Deployment Features

- **Automatic**: Created on every push to a branch
- **Unique URLs**: Each branch gets its own preview URL
- **Environment Isolation**: Use preview-specific environment variables
- **Live Collaboration**: Share preview links with team members

### Preview Best Practices

1. **Use Preview Environment Variables**: Set different values for preview vs. production
2. **Test Each PR**: Preview deployments make it easy to test changes
3. **Share Links**: Use preview URLs for stakeholder reviews
4. **Check Analytics**: Vercel Analytics work in preview mode

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Environment Variables Not Loading
1. Restart your dev server after changing `.env.local`
2. Ensure variables start with `NEXT_PUBLIC_` for client-side access
3. Check for typos in variable names

### Supabase Connection Issues
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key (not service role)
3. Ensure Supabase project is not paused

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building
npm run build
```

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit

# Generate fresh types
npm run build
```

### Missing Features
- Ensure all required feature flags are set
- Check that environment variables are properly configured
- Verify API keys are valid and have correct permissions

---

## Preview Checklist

Before sharing a preview, verify:

- [ ] All environment variables are set
- [ ] Auth flow works (magic link login)
- [ ] AI features are functional
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Analytics are tracking (if enabled)
- [ ] Feature flags are configured correctly

---

## Getting Help

### Documentation
- [Architecture](./ARCHITECTURE.md)
- [Style Guide](./docs/STYLE_GUIDE.md)
- [Feature Flags](./FEATURE_FLAGS.md)

### Community
- GitHub Issues: Report bugs or request features
- GitHub Discussions: Ask questions or share ideas

### Development
- Run tests: `npm test`
- Lint code: `npm run lint`
- Visual tests: `npx tsx scripts/visual-smoke-test.ts`

---

## Preview Access Levels

### Public Preview
- Accessible via preview URL
- No authentication required for landing page
- Auth required for app features

### Founders Pass Preview
- Access via `/founderspass` with PIN
- Full admin capabilities
- Experimental features enabled

### Regional Previews
- UK: `/uk`
- US: `/us` (default)
- More regions coming soon

---

## Next Steps

After previewing:

1. **Test Core Features**: Auth, AI, voice interaction
2. **Check Responsiveness**: Test on different screen sizes
3. **Verify Analytics**: Confirm tracking is working
4. **Review Performance**: Check Lighthouse scores
5. **Share Feedback**: Open issues or discussions

---

*Happy Previewing! 🚀*

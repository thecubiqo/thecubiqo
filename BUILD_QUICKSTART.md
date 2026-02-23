# Quick Start - Building cubiqo.ai

## Build the App

```bash
npm run build
```

✅ **Expected Result**: Build completes successfully in ~20 seconds

## Environment Variables

For **local development** or **build testing**, use the placeholder values in `.env.local` (already created).

For **production deployment**, set these environment variables:

### Required for Production
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-real-service-role-key

# WebAuthn (Optional - defaults to localhost)
NEXT_PUBLIC_RP_ID=cubiqo.ai
NEXT_PUBLIC_ORIGIN=https://www.cubiqo.ai
```

### Optional (AI Features)
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test:run

# Lint code
npm run lint
```

## Troubleshooting

### Build fails with font error
- **Fixed**: This issue is resolved by using `@fontsource/inter` instead of `next/font/google`
- The app now builds successfully without internet access

### Build fails with "supabaseUrl is required"
- Make sure `.env.local` exists with placeholder values (for build)
- For production, set real Supabase credentials in environment variables

### Build is slow
- First build takes longer (~20s) due to Turbopack compilation
- Subsequent builds are faster with caching

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```bash
docker build -t cubiqo .
docker run -p 3000:3000 cubiqo
```

### Traditional Node Server
```bash
npm run build
npm run start
```

## Build Output

Successful build shows:
- ✓ Compiled successfully
- ✓ Collecting page data
- ✓ Generating static pages (108/108)
- ✓ Finalizing page optimization

## What Changed?

The build system now uses local font packages instead of fetching from Google Fonts CDN, which:
- ✅ Allows builds without internet access
- ✅ Makes builds faster and more reliable
- ✅ Maintains the same visual appearance
- ✅ Works in CI/CD pipelines

For detailed technical information, see [BUILD_FIX_SUMMARY.md](BUILD_FIX_SUMMARY.md)

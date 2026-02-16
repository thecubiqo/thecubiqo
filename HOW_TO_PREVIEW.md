# How to Preview CubiQo Locally

This guide explains how to preview CubiQo on your local machine before deploying to production.

## Quick Start

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- Git

### Basic Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials (see Configuration section below)

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The app will hot-reload as you make changes

## Configuration

### Supabase Setup (Required)

CubiQo requires Supabase for authentication and data storage:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials from Project Settings → API
3. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional Configuration

- **AI Provider Keys**: Add API keys for Anthropic, OpenAI, Groq, etc. (see `.env.example`)
- **Voice Synthesis**: Add ElevenLabs API key for text-to-speech
- **Feature Flags**: Enable/disable features via environment variables

## Preview Modes

### Development Mode (Default)

```bash
npm run dev
```

- Fast refresh and hot reloading
- Detailed error messages
- Development-only debugging tools
- Runs on `http://localhost:3000`

### Production Build (Local)

Test the production build locally before deploying:

```bash
# Build for production
npm run build

# Start production server
npm start
```

- Optimized build with tree-shaking
- Runs on `http://localhost:3000`
- Mimics production environment

### Network Access

To preview on other devices (phone, tablet) on your local network:

1. Find your local IP address:
   - **macOS/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Access from other devices:
   - Use your IP address: `http://192.168.1.x:3000`
   - Ensure devices are on the same network

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is occupied:

```bash
# Use a different port
PORT=3001 npm run dev
```

Or kill the process using port 3000:
- **macOS/Linux**: `lsof -ti:3000 | xargs kill`
- **Windows**: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

### Missing Dependencies

If you encounter module errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Cache Issues

If the build behaves unexpectedly:

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Supabase Connection Issues

If authentication fails:

1. Verify your `.env.local` has correct Supabase credentials
2. Check Supabase Dashboard → Logs → Auth Logs for errors
3. Ensure your Supabase project is active and not paused

### TypeScript Errors

If you see TypeScript errors:

```bash
# Generate fresh types from Supabase
npm run generate-types

# Or manually check types
npm run type-check
```

## Alternative Preview Methods

### Vercel Deployment Preview

Deploy preview branches to Vercel:

1. Push your branch to GitHub
2. Vercel automatically creates a preview deployment
3. Access via the preview URL in the GitHub PR

### Docker (Coming Soon)

Docker support for containerized previews is planned for a future release.

### Local Network Access with ngrok

Expose your local server to the internet temporarily:

```bash
# Install ngrok
npm install -g ngrok

# Start dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Use the provided `https://` URL to access your local instance from anywhere.

## Performance Tips

- **Turbopack**: Next.js 16 uses Turbopack by default for faster builds
- **Incremental Type Checking**: TypeScript checks incrementally during development
- **Build Cache**: Keep `.next` folder for faster subsequent builds

## Security Notes

- Never commit `.env.local` to version control
- Keep service role keys secret (server-side only)
- Use environment variables in Vercel for production secrets
- Test auth flows in production build mode before deploying

## Getting Help

- **Documentation**: Check `README.md` for general project info
- **Troubleshooting**: See `AUTH_TROUBLESHOOTING.md` for auth-specific issues
- **Community**: Open an issue on GitHub for bugs or feature requests

---

**Ready to deploy?** See `DEPLOYMENT_CHECKLIST.md` for production deployment steps.

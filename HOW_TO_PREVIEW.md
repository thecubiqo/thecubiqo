# How to Access the Preview

This guide shows you how to quickly access and view the CubiQo application preview.

## Quick Start

The preview is accessible by running the development server locally.

### Steps to Access Preview

1. **Install Dependencies** (first time only)
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Local: http://localhost:3000
   - Network: http://[your-network-ip]:3000

The application will start and be ready within seconds.

## What You'll See

When you access the preview, you'll see the beautiful CubiQo landing page:

![CubiQo Preview](https://github.com/user-attachments/assets/ca2a7994-a18b-4653-845f-57aeb8bf2ac8)

**Features visible in preview:**
- ✨ Animated wave visualization with gradient colors (cyan, magenta, orange)
- 🎨 "CUBIQO" branding with tagline "One Mind. Many Dimensions."
- 👆 Interactive "TAP ANYWHERE TO BEGIN" prompt
- 🌌 Starfield background with animated particles

## Preview Modes

### Development Mode (Default)
```bash
npm run dev
```
- Hot reload enabled
- Fast refresh for instant updates
- Source maps for debugging
- Runs on http://localhost:3000

### Production Preview
```bash
npm run build
npm start
```
- Optimized production build
- No hot reload
- Smaller bundle size
- Runs on http://localhost:3000

### Preview Mode (Without Supabase)

The application now supports running without Supabase credentials:
- Guest mode automatically enabled
- No authentication errors
- UI fully functional
- See [PREVIEW_MODE.md](./PREVIEW_MODE.md) for details

## Stopping the Preview

Press `Ctrl+C` in the terminal where the dev server is running.

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is busy, Next.js will automatically use the next available port (3001, 3002, etc.).

Check the terminal output for the actual URL:
```
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3001  ← Use this URL
```

### Dependencies Not Installed

If you see "command not found" or similar errors:
```bash
npm install
```

### Build Errors

Clear the build cache and rebuild:
```bash
rm -rf .next
npm run dev
```

## Alternative Preview Methods

### 1. Vercel Preview Deployments

Every branch automatically gets a preview deployment:
- Format: `https://cubiqo-[branch-name]-[project].vercel.app`
- Auto-deploys on every push
- See [PREVIEW_AND_INTEGRATION_GUIDE.md](./PREVIEW_AND_INTEGRATION_GUIDE.md)

### 2. Local Network Access

Share preview with devices on same network:
1. Start dev server: `npm run dev`
2. Find network URL in terminal output
3. Access from other devices: `http://[your-ip]:3000`

### 3. Production Build

Test the production-optimized version:
```bash
npm run build && npm start
```

## Features to Try in Preview

Once the preview loads, you can:

1. **Explore the Landing Page**
   - Watch the animated wave visualization
   - See the gradient color transitions
   - Observe the starfield background

2. **Interact with the UI**
   - Click/tap anywhere to enter the application
   - Try the voice interface (if permissions granted)
   - Navigate through different sections

3. **Test Settings**
   - Click the Settings button (top right)
   - Configure BYO (Bring Your Own) API keys
   - Adjust preferences

4. **Sign In / Guest Mode**
   - Test authentication flow (requires Supabase)
   - Or continue in guest mode (no config needed)

## Development Tips

### Auto-Reload

The dev server supports hot module replacement:
- Save any file to see changes instantly
- No manual refresh needed
- State is preserved during updates

### Console Logs

Open browser DevTools to see:
- Application logs
- Network requests
- React component tree
- Performance metrics

### Mobile Preview

Test mobile responsiveness:
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select mobile device preset
4. Or use network URL on real device

## Related Documentation

- [README.md](./README.md) - Main project documentation
- [PREVIEW_MODE.md](./PREVIEW_MODE.md) - Running without database
- [PREVIEW_AND_INTEGRATION_GUIDE.md](./PREVIEW_AND_INTEGRATION_GUIDE.md) - Vercel deployments
- [QUICK_START.txt](./QUICK_START.txt) - Getting started guide

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full documentation in [README.md](./README.md)
3. Open an issue on GitHub

---

**The preview is now accessible at http://localhost:3000** 🚀

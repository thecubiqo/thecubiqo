# Landing UI Deployment Guide

This guide explains how to configure and deploy the Landing UI (Plasma Wave Field and Tech Wireframe variants) to production.

## Overview

The landing system uses a configurable router (`LandingCubeRouter`) that can display two different landing cube designs:

- **plasma-wave**: Beautiful flowing plasma waves with 120,000+ particles (default)
- **tech-wireframe**: High-tech wireframe energy cube with voice-reactive animations

## Configuration

### Environment Variables

Configure the landing system using these environment variables:

#### `NEXT_PUBLIC_LANDING_DEFAULT`

Set the default landing variant to display.

- **Type**: `'plasma-wave' | 'tech-wireframe'`
- **Default**: `'plasma-wave'`
- **Example**:
  ```bash
  NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave
  ```

#### `NEXT_PUBLIC_LANDING_ENABLE`

Enable or disable the landing animation entirely.

- **Type**: `'true' | 'false'`
- **Default**: `true`
- **Example**:
  ```bash
  NEXT_PUBLIC_LANDING_ENABLE=true
  ```

### URL Override

Users can override the default variant using URL parameters for testing/preview:

```
https://cubiqo.ai/?landing=plasma-wave
https://cubiqo.ai/?landing=tech-wireframe
```

This requires `allowUrlOverride: true` in `src/config/landing.ts` (enabled by default).

## Feature Flags

The landing system integrates with the feature flag system via `ui.landing.particles.v1`:

- When enabled: Landing screen appears on first visit or after 4 hours
- When disabled: No landing screen is shown

Configure this flag in your Supabase feature flags table.

## Deployment Steps

### 1. Development Testing

Test locally before deploying:

```bash
# Test plasma-wave variant (default)
npm run dev

# Test tech-wireframe variant
NEXT_PUBLIC_LANDING_DEFAULT=tech-wireframe npm run dev

# Test with landing disabled
NEXT_PUBLIC_LANDING_ENABLE=false npm run dev
```

Visit `http://localhost:3000` to see the landing screen.

### 2. Staging Deployment

Deploy to staging with environment variables:

```bash
# Set environment variables in Vercel/hosting platform
NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave
NEXT_PUBLIC_LANDING_ENABLE=true

# Deploy
npm run build
```

### 3. Production Rollout

#### Option A: Immediate Full Rollout

1. Set environment variables in production:
   ```bash
   NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave
   NEXT_PUBLIC_LANDING_ENABLE=true
   ```

2. Enable feature flag in Supabase:
   - Flag: `ui.landing.particles.v1`
   - Status: `enabled`

3. Deploy to production:
   ```bash
   npm run build
   npm run start
   ```

#### Option B: Gradual Rollout

1. Deploy with landing enabled but feature flag off
2. Test manually with `?landing=plasma-wave` URL parameter
3. Gradually increase feature flag rollout percentage
4. Monitor performance and user feedback

### 4. Validation

After deployment, verify:

- ✅ Landing screen appears on first visit
- ✅ Plasma waves are animated (not static)
- ✅ Click/tap dismisses landing and shows main app
- ✅ URL parameter `?landing=tech-wireframe` works
- ✅ No console errors in browser DevTools
- ✅ Canvas/WebGL initializes without hydration warnings

### 5. Rollback

If issues occur, quickly disable via feature flag:

```bash
# Option 1: Disable via feature flag (immediate)
Update 'ui.landing.particles.v1' to disabled in Supabase

# Option 2: Disable via environment variable (requires redeploy)
NEXT_PUBLIC_LANDING_ENABLE=false
```

## Troubleshooting

### Landing Not Showing

**Possible causes:**

1. Feature flag `ui.landing.particles.v1` is disabled
   - **Fix**: Enable in Supabase feature flags

2. Environment variable `NEXT_PUBLIC_LANDING_ENABLE` is false
   - **Fix**: Set to `true` or remove (defaults to true)

3. User visited within last 4 hours
   - **Fix**: Clear `cubiqo_last_landing` from localStorage
   - **Expected**: Landing only shows once every 4 hours

4. URL parameter `?force-landing=1` not working
   - **Fix**: This is expected - use dev tools to clear localStorage instead

### Plasma Waves Static (Not Animated)

**Possible causes:**

1. `isEnabled={false}` in `LandingCube.tsx`
   - **Fix**: Change to `isEnabled={true}` (line 40 in `src/components/LandingCube.tsx`)

2. WebGL not supported in browser
   - **Fix**: Test in modern Chrome/Firefox/Safari
   - **Note**: WebGL is required for particle effects

### Performance Issues

**Symptoms:**
- Low frame rate (<30 FPS)
- Browser lag or freezing

**Solutions:**

1. Reduce particle count in `PlasmaWaveField.tsx`:
   ```typescript
   const PARTICLE_COUNT = 60000 // Reduced from 120000
   ```

2. Switch to tech-wireframe variant (lower particle count):
   ```bash
   NEXT_PUBLIC_LANDING_DEFAULT=tech-wireframe
   ```

3. Disable on mobile devices (check user agent in code)

### Hydration Warnings

If you see hydration mismatches in console:

1. Ensure `'use client'` directive is present in component files
2. Check that server and client configs match
3. Verify no dynamic client-only values in initial render

## Monitoring

Monitor these metrics post-deployment:

- **Performance**: Frame rate (target: 60 FPS)
- **Load time**: Time to first frame (target: <1s)
- **Error rate**: Check for WebGL errors in logs
- **User engagement**: Time to dismiss landing screen

## Architecture Notes

### Component Hierarchy

```
src/app/page.tsx (Server Component)
├── FullscreenApp (Client Component)
    └── LandingCubeRouter (Client Component)
        ├── LandingCube (plasma-wave variant)
        │   └── PlasmaWaveField (120K particles)
        └── TechLandingCube (tech-wireframe variant)
            └── EnergyLines (lower particle count)
```

### Configuration Flow

1. Environment variables → `src/config/landing.ts`
2. Feature flag check → `src/app/page.tsx`
3. Router selection → `LandingCubeRouter`
4. Component render → `LandingCube` or `TechLandingCube`

## Related Documentation

- `LANDING_UI_GUIDE.md`: Design switching guide
- `PR #49`: Original implementation
- `PR #51`: PlasmaWaveField integration
- `src/config/landing.ts`: Configuration reference
- `src/components/LandingCubeRouter.tsx`: Router implementation

## Support

For issues or questions:

1. Check console for errors
2. Verify environment variables are set correctly
3. Test with URL parameter override
4. Review related PRs for additional context
5. Contact the development team

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0

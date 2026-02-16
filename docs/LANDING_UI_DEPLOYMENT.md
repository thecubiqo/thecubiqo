# Landing UI Deployment Guide

This document describes how to configure and deploy the landing cube animation system in production environments.

## Overview

The landing page features a configurable cube animation system that displays on first visit and periodically thereafter (every 4+ hours). The system supports two variants:

1. **Plasma Wave** (default): Beautiful flowing plasma waves with 120,000+ particles
2. **Tech Wireframe**: High-tech wireframe energy cube with voice-reactive animations

## Environment Configuration

### Environment Variables

Configure the landing system using these environment variables:

#### `NEXT_PUBLIC_LANDING_DEFAULT`

Controls which landing cube variant to display.

- **Type**: String
- **Options**: `plasma-wave` | `tech-wireframe`
- **Default**: `plasma-wave`
- **Example**:
  ```bash
  NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave
  ```

#### `NEXT_PUBLIC_LANDING_ENABLE`

Enables or disables the landing cube animation entirely.

- **Type**: Boolean string
- **Options**: `true` | `false`
- **Default**: `true`
- **Example**:
  ```bash
  NEXT_PUBLIC_LANDING_ENABLE=true
  ```

### Configuration Priority

The landing system respects the following priority order:

1. **Component prop** (`variant` prop on `LandingCubeRouter`)
2. **URL parameter** (`?landing=plasma-wave` or `?landing=tech-wireframe`)
3. **Environment variable** (`NEXT_PUBLIC_LANDING_DEFAULT`)
4. **Fallback default** (`plasma-wave`)

### Backward Compatibility

The landing system maintains backward compatibility with the existing feature flag system:

- Feature flag: `ui.landing.particles.v1` (database-based)
- Environment config: `NEXT_PUBLIC_LANDING_ENABLE` (build-time)

Landing will be enabled if **either** the feature flag OR the environment variable is set to enable it. This allows for:
- Gradual migration from feature flags to environment-based config
- Feature flag overrides during development/testing
- Environment-based control in production

## Deployment Steps

### 1. Local Development

Test the landing system locally:

```bash
# Set environment variables in .env.local
echo "NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave" >> .env.local
echo "NEXT_PUBLIC_LANDING_ENABLE=true" >> .env.local

# Install dependencies and run dev server
npm install
npm run dev

# Test with URL overrides
# Plasma Wave: http://localhost:3000/?landing=plasma-wave
# Tech Wireframe: http://localhost:3000/?landing=tech-wireframe
```

### 2. Production Deployment (Vercel)

#### Via Vercel Dashboard

1. Go to your project settings: https://vercel.com/your-org/thecubiqo/settings/environment-variables
2. Add the following environment variables:
   - `NEXT_PUBLIC_LANDING_DEFAULT` = `plasma-wave`
   - `NEXT_PUBLIC_LANDING_ENABLE` = `true`
3. Redeploy the application

#### Via Vercel CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_LANDING_DEFAULT production
# Enter value: plasma-wave

vercel env add NEXT_PUBLIC_LANDING_ENABLE production
# Enter value: true

# Redeploy
vercel --prod
```

#### Via Environment Variables in vercel.json

Add to your `vercel.json`:

```json
{
  "env": {
    "NEXT_PUBLIC_LANDING_DEFAULT": "plasma-wave",
    "NEXT_PUBLIC_LANDING_ENABLE": "true"
  }
}
```

### 3. Other Hosting Platforms

#### Netlify

Add to your build environment variables or `netlify.toml`:

```toml
[build.environment]
  NEXT_PUBLIC_LANDING_DEFAULT = "plasma-wave"
  NEXT_PUBLIC_LANDING_ENABLE = "true"
```

#### Docker

Add to your Dockerfile or docker-compose.yml:

```dockerfile
ENV NEXT_PUBLIC_LANDING_DEFAULT=plasma-wave
ENV NEXT_PUBLIC_LANDING_ENABLE=true
```

## Validation

After deployment, validate the configuration:

### 1. Check Landing Displays

Visit the production URL and verify:
- Landing animation displays on first visit
- Correct variant is shown (plasma-wave or tech-wireframe)
- Animation completes and transitions to main app when clicked

### 2. Check URL Override

Test URL parameter override still works:
- `https://cubiqo.ai/?landing=plasma-wave`
- `https://cubiqo.ai/?landing=tech-wireframe`

### 3. Check Browser Console

Open browser DevTools console and verify:
- No errors during landing animation
- Canvas element is mounted correctly
- No SSR hydration warnings

### 4. Clear Local Storage

Test "first visit" behavior by clearing landing timestamp:

```javascript
// In browser console
localStorage.removeItem('cubiqo_last_landing')
location.reload()
```

## Troubleshooting

### Landing Not Showing

**Possible causes:**

1. **Environment variable not set correctly**
   - Check `NEXT_PUBLIC_LANDING_ENABLE` is `true` (or not set, as default is true)
   - Verify environment variables are set at build time (not runtime)

2. **Feature flag disabled**
   - If relying on feature flags, check `ui.landing.particles.v1` in database
   - Consider migrating to environment-based config

3. **Local storage timestamp**
   - Landing only shows once per 4 hours
   - Clear `cubiqo_last_landing` from localStorage to test

4. **Build cache**
   - Environment variables are embedded at build time
   - Rebuild and redeploy after changing env vars

### Wrong Variant Showing

**Possible causes:**

1. **Environment variable value incorrect**
   - Check `NEXT_PUBLIC_LANDING_DEFAULT` is exactly `plasma-wave` or `tech-wireframe`
   - Case-sensitive! Must match exactly

2. **URL parameter override**
   - Check URL for `?landing=` parameter
   - URL parameters take precedence over config

3. **Build cache**
   - Clear build cache and rebuild

### Canvas Not Rendering

**Possible causes:**

1. **WebGL not supported**
   - Verify browser supports WebGL
   - Check for hardware acceleration issues

2. **SSR hydration mismatch**
   - Component should be client-side only (`'use client'`)
   - Check for server/client rendering conflicts

## Performance Considerations

### Plasma Wave (120K particles)

- **GPU Intensive**: Requires modern GPU
- **Mobile**: May throttle on low-end devices
- **Optimization**: Uses instanced rendering for performance
- **Load Time**: ~2-3 seconds on fast connections

### Tech Wireframe

- **Lighter**: Better mobile performance
- **Shaders**: Custom GLSL shaders, more efficient
- **Load Time**: ~1-2 seconds on fast connections

## Rollback Plan

If issues arise, you can quickly rollback:

### Option 1: Disable Landing Entirely

```bash
# Set environment variable
NEXT_PUBLIC_LANDING_ENABLE=false

# Redeploy
```

### Option 2: Switch to Tech Wireframe

```bash
# Use lighter variant
NEXT_PUBLIC_LANDING_DEFAULT=tech-wireframe

# Redeploy
```

### Option 3: Use Feature Flag

Disable via database feature flag:
- Set `ui.landing.particles.v1` to `false` in Supabase

## Monitoring

### Metrics to Track

1. **Load Performance**
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Canvas render time

2. **User Behavior**
   - Landing completion rate
   - Time spent on landing
   - Skip/click-through rate

3. **Errors**
   - WebGL errors
   - Canvas mounting failures
   - SSR hydration warnings

### Analytics Events

The landing system can be instrumented with analytics:

```typescript
// Example analytics integration
import { track } from '@vercel/analytics'

// Track landing shown
track('landing_shown', { variant: 'plasma-wave' })

// Track landing completed
track('landing_completed', { 
  variant: 'plasma-wave',
  duration_ms: 3500
})
```

## Additional Resources

- [LANDING_UI_GUIDE.md](../LANDING_UI_GUIDE.md) - User guide and customization
- [LANDING_UI_INTEGRATION_SUMMARY.md](../LANDING_UI_INTEGRATION_SUMMARY.md) - Integration details
- [src/config/landing.ts](../src/config/landing.ts) - Configuration source code
- [src/components/LandingCubeRouter.tsx](../src/components/LandingCubeRouter.tsx) - Router implementation

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the existing documentation

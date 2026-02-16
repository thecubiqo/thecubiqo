# OpenClaw Provider Integration

## Overview

CubiQo supports OpenClaw as an optional AI provider. This integration is **disabled by default** and only activates when explicitly enabled with the required API key.

## How to Enable OpenClaw

### 1. Set Environment Variables

Add the following to your `.env.local` file:

```bash
# OpenClaw API Key (required)
OPENCLAW_API_KEY=your_openclaw_api_key_here

# Explicitly enable OpenClaw provider
NEXT_PUBLIC_ENABLE_OPENCLAW=true
```

### 2. Verify Configuration

The OpenClaw provider will only be enabled if:
- `NEXT_PUBLIC_ENABLE_OPENCLAW` is set to `'true'`
- `OPENCLAW_API_KEY` is provided

You can verify which providers are enabled by checking the console logs or using the provider validation utility:

```typescript
import { getAIProviderFlags, validateProviderEnvironment } from '@/lib/ai/providers'

// Check enabled providers
const flags = getAIProviderFlags()
console.log('OpenClaw enabled:', flags.enableOpenClaw)

// Validate environment
const missing = validateProviderEnvironment()
if (missing.length > 0) {
  console.warn('Missing API keys:', missing)
}
```

## Feature Flag Design

The OpenClaw integration follows these principles:

1. **No Runtime Dependency**: Without the API key and feature flag, OpenClaw code has zero runtime impact
2. **Explicit Opt-in**: Must be explicitly enabled via `NEXT_PUBLIC_ENABLE_OPENCLAW=true`
3. **Safe Defaults**: Disabled by default to prevent accidental usage
4. **Environment Validation**: Built-in validation warns if keys are missing for enabled providers

## Provider Priority

When OpenClaw is enabled, it joins the provider fallback chain. The current order is:

1. OpenClaw (if enabled)
2. MiniMax (default primary)
3. Mixtral
4. Llama
5. Claude Haiku (fallback)

## API Reference

### `getAIProviderFlags()`
Returns current feature flags for all AI providers

### `getEnabledProviders()`
Returns array of enabled provider configurations

### `isProviderEnabled(name: string)`
Checks if a specific provider is enabled

### `validateProviderEnvironment()`
Returns array of missing environment variables for enabled providers

## Security Notes

- API keys should never be committed to version control
- Use `.env.local` for local development
- Use Vercel environment variables for production
- OpenClaw keys follow standard environment variable security practices

## Troubleshooting

### OpenClaw Not Working

1. Check that `NEXT_PUBLIC_ENABLE_OPENCLAW=true` is set
2. Verify `OPENCLAW_API_KEY` is provided
3. Restart your development server after adding environment variables
4. Check console for validation warnings

### Provider Order Issues

Providers are attempted in the order returned by `getEnabledProviders()`. If OpenClaw should be primary, ensure it's enabled first in the list.

# CubiQo Environment Variables

This file is the working list for local `.env.local` and Vercel environment variables.

## Browser Automation

Required for V2 Stagehand/Browserbase browser workflows:

| Variable | Scope | Notes |
| --- | --- | --- |
| `BROWSERBASE_API_KEY` | Server only | Browserbase API key used by Stagehand. Never expose to the client. |
| `BROWSERBASE_PROJECT_ID` | Server only | Browserbase project id used when opening isolated sessions. |
| `SUPABASE_STORAGE_BUCKET` | Server only | Storage bucket for browser visual receipts. Default: `browser-screenshots`. |
| `STAGEHAND_MODEL_NAME` | Server only, optional | Stagehand model override. Default: `openai/gpt-4.1-mini`. |
| `VAPID_SUBJECT` | Server only | Required with VAPID keys for real Web Push delivery. No hardcoded production fallback is used. |

Local `.env.local` template:

```bash
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
SUPABASE_STORAGE_BUCKET=browser-screenshots
# Optional:
STAGEHAND_MODEL_NAME=openai/gpt-4.1-mini
```

Vercel environments to configure:

- Preview: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `SUPABASE_STORAGE_BUCKET`
- Production: configure only after owner approval; browser automation remains blocked from targeting QA/prod URLs by hard guardrails.

## Shopify / POD API Connectors

Required for V2 direct API connector workflows. These are server-side only and must not be exposed through `NEXT_PUBLIC_*` variables.

| Variable | Scope | Notes |
| --- | --- | --- |
| `SHOPIFY_CLIENT_ID` | Server only | Shopify app client id used to start OAuth. |
| `SHOPIFY_CLIENT_SECRET` | Server only | Shopify app secret used to exchange OAuth code for Admin API token. |
| `SHOPIFY_API_VERSION` | Server only, optional | Shopify Admin REST API version. Default: `2025-10`. |
| `PRINTIFY_API_KEY` | Server only, optional bootstrap | Optional server-level Printify API key. User-pasted keys are encrypted in Supabase instead. |
| `ENCRYPTION_SECRET` | Server only | Token vault secret. Used for AES-256-GCM encryption of Shopify/Printify tokens at rest. |
| `ELEVENLABS_VOICE_ID` | Server only, optional | Overrides `platform_settings.voice_defaults.elevenlabs_voice_id`. |
| `ELEVENLABS_MODEL_ID` | Server only, optional | Overrides `platform_settings.voice_defaults.elevenlabs_model_id`. |
| `ALLOW_GLOBAL_COMMERCE_CONNECTORS_FOR_ADMIN_ONLY` | Server only, optional | Allows shared server env commerce tokens only for explicit admin/single-tenant deployments. Default: disabled. |
| `ALLOW_GLOBAL_SOCIAL_CONNECTORS_FOR_ADMIN_ONLY` | Server only, optional | Allows shared server env social API tokens only for explicit admin/single-tenant deployments. Default: disabled. |

Local `.env.local` template:

```bash
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_API_VERSION=2025-10
PRINTIFY_API_KEY=
ENCRYPTION_SECRET=
```

Vercel environments to configure:

- Preview: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_API_VERSION`, `PRINTIFY_API_KEY`, `ENCRYPTION_SECRET`
- Production: configure only after owner approval; this branch does not touch prod aliases.

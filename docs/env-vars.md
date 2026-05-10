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

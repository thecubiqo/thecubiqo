# Supabase Readiness

This app uses Supabase from the browser through `frontend/src/lib/supabase.js`.

## Required Frontend Variables

Set these in Vercel for the environments that build the frontend:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

The anon key is intended for browser use, but it must still rely on Supabase Row Level Security. Do not put service-role keys in frontend code or `REACT_APP_*` variables.

## Local Development

Create `frontend/.env.local` from `frontend/.env.example` and fill in the project values locally.

`frontend/.env.local` is ignored by Git through the existing `.gitignore` env patterns.

## Vercel Environments

Recommended mapping:

- Production: `cubiqo.ai` / `www.cubiqo.ai`
- Preview: pull request preview deployments
- Development: local Desktop Codex or local developer machines

If the project grows, use separate Supabase projects for production and non-production. Until then, keep schema changes small, use migrations, and verify RLS before deploying features that read or write user data.

## Minimum Safety Checklist

- RLS enabled on user-owned tables.
- Policies tested for anonymous and authenticated users.
- No service-role key in client code, logs, screenshots, or committed files.
- Vercel env vars present for Production and Preview.
- Schema changes documented before merge.

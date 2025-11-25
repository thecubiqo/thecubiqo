# CubiQo Phase 2

> One Mind. Many Dimensions.

**Status:** 🚧 In Development
**Preview:** https://cubiqo-repo-git-phase2-cubiqo-projects-d7156840.vercel.app

---

## Quick Verification

### Database Status

Run in **Supabase SQL Editor**:
```sql
-- Quick check
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Expected: **6 tables** (conversations, events, memory, messages, profiles, sessions)

**Full verification:** Run `supabase/verify_schema.sql`

### Type Safety Test

```bash
npm run build
```

Should compile successfully with TypeScript types from database.

---

## Development

```bash
# Install
npm install

# Run dev server
npm run dev  # localhost:3000

# Build
npm run build
```

---

## Tech Stack

Next.js 16 • React 19 • Tailwind CSS 4 • Supabase • Three.js • TypeScript

---

## Documentation

- **Architecture:** `ARCHITECTURE-Phase2.md`
- **Database Testing:** `docs/DATABASE_TESTING.md`
- **Work Plan:** `WORK-PLAN-Phase2.md`

---

**Version:** 2.0.0 • **Updated:** 2025-11-24

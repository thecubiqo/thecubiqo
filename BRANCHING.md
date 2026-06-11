# Branching Policy

CubiQo runs on **exactly two long-lived branches**. Everything else is ephemeral.

## Long-lived branches

| Branch | Deploys to | Purpose |
|--------|-----------|---------|
| `main` | https://cubiqo.ai (production) | The single source of truth. Always releasable. |
| `staging` | https://staging.cubiqo.ai | Pre-production verification. Mirrors `main` + the next release candidate. |

## Feature branches

- A new feature **may** have its own branch (`feature/<name>` or `fix/<name>`).
- After it merges, **delete the branch immediately**. No long-lived feature branches.
- Before deletion, the work must already be on `main` (or `staging` → `main`).

## The replacement rule (non-negotiable)

**Do not create a parallel implementation.** When you change a flow:

1. **Replace** the active implementation, or put the new one behind a **named feature flag**.
2. Never leave old + new both active.
3. At the end of the change, **prove it**: list which files / routes / components are now active, and which legacy files are unused (deleted, moved to `/legacy`, or flag-gated).

Old code becomes one of: deleted · moved to `/legacy` · behind a named flag · kept as un-imported backup. Never half-wired.

## Frontend

There is **one** frontend: what ships on production `main`. The legacy CRA in `frontend/src/` is consumed as a library by the Next app (it renders at `/app` via `CubiQoNextShell`). No second frontend, no competing shells.

## Navigation

**No redirect URLs for in-app navigation.** Every feature screen opens as an **overlay on top of the CubiQo hero** at `/app`. The only real routes are the hero (`/`), the app shell (`/app`), and auth/callback. Left panel = features (as overlays); right panel = RGY capsule + chatrooms + launched dashboards.

## Archived history

Every branch that existed before this policy (51 of them) was tagged `archive/<branch-name>` before deletion — nothing is lost. Recover any with:

```
git checkout -b <name> archive/<name>
```

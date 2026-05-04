# AGENTS.md

## Scope
This file governs the entire repository unless overridden by a deeper `AGENTS.md`.

## Project responsibility (source of truth)
- Primary production app only:
  - Project/product name: `cq.ai`
  - Vercel project: `cubiqo-repo`
  - Domains: `cubiqo.ai`, `www.cubiqo.ai`
  - GitHub repo: `thecubiqo/thecubiqo`
- Do **not** work on the separate `thecubiqo.vercel.app` plasma/cuboid experiment unless explicitly requested.

## Operational checklist
Before opening or merging PRs that affect production, verify/provision:
1. GitHub repo connected
2. Can create branches
3. Can open PRs
4. Vercel PR previews enabled
5. Correct project responsibility documented (`cubiqo-repo`)
6. `AGENTS.md` committed to repo
7. Branch protection on `main`
8. Required checks/builds configured
9. Preview URL appears on PRs
10. No access to unrelated experimental project unless explicitly needed
11. Clear PR review/merge/deploy policy

## Enforcement notes
- If an item cannot be verified from the current environment, mark it as "Needs owner verification" and provide exact next steps.

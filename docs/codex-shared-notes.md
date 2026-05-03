# Codex Shared Notes

This document is the shared working notebook for Desktop Codex and Cloud Codex on the primary CubiQo app.

Use it for durable project context that should survive across chats, machines, and agents. Keep it factual, concise, and updated through normal Git branches and pull requests.

## Scope

- Primary project: `cubiqo-repo`
- Production domains: `cubiqo.ai`, `www.cubiqo.ai`
- GitHub repo: `thecubiqo/thecubiqo`
- Separate experiment: `thecubiqo.vercel.app` plasma/cuboid project

Do not mix the separate plasma/cuboid experiment into the primary `cubiqo.ai` app unless the user explicitly asks.

## Current Operating Model

- Desktop Codex is best for local browser checks, screenshots, and visual QA.
- Cloud Codex is best for clean repo branches, PRs, CI fixes, and reviewable code changes.
- GitHub is the source of truth between Desktop and Cloud.
- Desktop-only changes must be committed and pushed before Cloud Codex can see them.
- Cloud Codex changes must be fetched or pulled before Desktop Codex can see them locally.

## Architecture Overview

```mermaid
flowchart TB
  U["You"] --> D["Desktop Codex<br/>Local app: cq.ai"]
  U --> C["Cloud Codex<br/>Browser app"]

  D --> L["Local workspace<br/>C:/.../New project 5"]
  L --> G["GitHub repo<br/>thecubiqo/thecubiqo"]
  C --> G

  G --> V["Vercel project<br/>cubiqo-repo"]
  V --> P["Production domains<br/>cubiqo.ai<br/>www.cubiqo.ai"]

  D -. local only .-> VL[".vercel/project.json<br/>links Desktop to cubiqo-repo<br/>not committed"]
  D --> B["Local dev server<br/>localhost:3000<br/>screenshots / visual QA"]
  C --> PR["Branches / PRs<br/>clean repo work<br/>CI fixes"]

  G --> A["AGENTS.md<br/>rules + boundaries"]
  G --> N["docs/codex-shared-notes.md<br/>shared notebook"]
  G --> S["docs/supabase-readiness.md<br/>database/env notes"]

  X["Separate project<br/>thecubiqo.vercel.app<br/>plasma/cuboid experiment"] -. keep separate .- G
```

```mermaid
flowchart LR
  subgraph Desktop["Desktop Codex"]
    D1["Reads/writes local files"]
    D2["Runs build/dev server"]
    D3["Screenshots + visual QA"]
    D4["Can inspect Vercel via connector"]
    D5["No deploy unless explicitly approved"]
  end

  subgraph Cloud["Cloud Codex"]
    C1["Works from GitHub"]
    C2["Creates branches/PRs"]
    C3["Uses AGENTS.md + shared notes"]
    C4["Good for clean code/CI work"]
    C5["Cannot see local-only files"]
  end

  D1 --> G["GitHub"]
  C1 --> G
  D2 --> D3
  G --> C3
```

```mermaid
flowchart TB
  F["Feature branch"] --> PR["Pull Request"]
  PR --> QA["Vercel Preview<br/>QA environment"]
  QA --> R["Review + test"]
  R --> M["Merge to main"]
  M --> PROD["Vercel Production<br/>cubiqo.ai / www.cubiqo.ai"]

  LOCAL["Desktop local dev<br/>localhost:3000"] --> F
  CLOUD["Cloud Codex branch work"] --> F
```

## Operating Rules Summary

- `cubiqo-repo` / `cubiqo.ai` / `www.cubiqo.ai` is the main project.
- `thecubiqo.vercel.app` is the separate plasma/cuboid experiment.
- GitHub is the sync layer between Desktop Codex and Cloud Codex.
- Desktop changes: commit, push, then Cloud Codex can see them.
- Cloud changes: push, then Desktop Codex must fetch or pull.
- Do not edit `main` directly.
- Do not deploy production unless explicitly approved.
- Use Vercel PR previews as QA.

## Default Cloud/Desktop Path

Cloud Codex is the default builder:

- create implementation branch
- make code changes
- open the pull request
- keep changes scoped to the task

Desktop Codex is the default verifier:

- fetch the Cloud branch or PR branch
- run build/checks locally
- run browser/screenshot QA for UI changes
- report pass/fail, risks, and release notes

PR creation owner: Cloud Codex.

Merge owner: the user by default. If the user explicitly delegates merge/release to an agent, Desktop Codex should only proceed after local verification passes and the target is confirmed as `cubiqo-repo` / `cubiqo.ai`.

Desktop Codex should not create duplicate PRs for Cloud Codex work. Cloud Codex should not treat unpushed Desktop local changes as available context.

## Workflow Ownership One-Liners

1. Exclusive coder: Cloud Codex.
2. Exclusive verifier: Desktop Codex.
3. Exclusive PR creator: Cloud Codex.
4. Exclusive PR merger: Desktop Codex, but only after user approval for production-impacting merges.
5. Branch created: Cloud Codex creates a feature branch when a new requirement/task starts.
6. Creating a PR: opening a GitHub pull request from the feature branch into the target branch.
7. PRs merge to: usually `main`, unless a dedicated `qa` or `staging` branch is added.
8. Merged branch after merge: feature branch becomes disposable and can be deleted.
9. Feedback loop: Desktop verifies, writes issues, Cloud fixes same PR branch, Desktop re-verifies.
10. Automation target: Cloud codes + pushes PR preview to QA automatically; prod waits for user approval.
11. Env usage: local/dev for Desktop, preview/QA for PRs, production for `main`.
12. Branch to env mapping: feature branch = Vercel Preview QA, `main` = Production; keep this constant unless staging is added.

## Pipeline Summary

- Dev: local Desktop Codex and feature branches.
- QA: Vercel pull request preview deployments.
- Prod: `main` deploys to `cubiqo.ai` / `www.cubiqo.ai`.
- Rollback: redeploy previous Vercel deployment or revert the merged PR.

## Environment Model

- Production: `main` deploys to `cubiqo.ai` / `www.cubiqo.ai`.
- QA: Vercel pull request preview deployments.
- Development: local Desktop Codex and feature branches.
- Optional future staging: add only if PR previews are not enough.

## Readiness Notes

- Local Desktop workspace has `.vercel/project.json` linked to `cubiqo-repo`, but `.vercel/` is ignored and local-only.
- `AGENTS.md` is the primary instruction file for agents.
- Supabase readiness notes live in `docs/supabase-readiness.md`.
- Avoid Terraform/Jenkins unless project complexity grows enough to justify formal infrastructure automation.

## Change Log

- 2026-05-02: Added agent guardrails, Supabase readiness notes, and this shared notebook on branch `codex/cubiqo-ai-readiness`.

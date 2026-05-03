# Codex Project Instructions

## Project Identity

This workspace is for the primary CubiQo production web app.

- Primary Vercel project: `cubiqo-repo`
- Vercel project ID: `prj_3jMMbaYBa3ONfgyGhOOlzYU1llIl`
- Vercel team: `Cubiqo` (`team_Q25fvpJOPiIeoG3hfxtCVkhW`)
- Production domains: `cubiqo.ai`, `www.cubiqo.ai`
- GitHub repo: `thecubiqo/thecubiqo`
- Production branch: `main`

## Project Boundaries

Do not mix this project with the separate CubiQo plasma/cuboid experiment.

- `cubiqo-repo` / `cubiqo.ai` / `www.cubiqo.ai` is the main production responsibility.
- `thecubiqo` / `thecubiqo.vercel.app` is a separate experimental plasma/cuboid project.
- Experimental plasma/cuboid work must happen in a separate chat, branch, and ideally a separate local workspace unless explicitly requested.

## Operating Rules

- Never deploy to production unless the user explicitly asks for a deployment.
- Never merge or push to `main` directly.
- Use feature branches for all changes.
- Keep unrelated refactors out of task branches.
- Preserve existing UI and functionality unless the user explicitly asks to change them.
- Before editing UI, identify the target route, component, and Vercel project.
- Before editing shared code, run focused checks and document residual risk.
- Treat `.vercel/project.json` as a local Desktop Codex convenience only; it is ignored by Git and should not be committed.

## Verification Expectations

For normal code changes:

- Run the relevant build or test command.
- For UI changes, run local browser/screenshot verification when practical.
- Check Git status before final response.
- Report files changed and commands run.

For production-sensitive work:

- Confirm the target Vercel project is `cubiqo-repo`.
- Confirm the target domains are `cubiqo.ai` / `www.cubiqo.ai`.
- Prefer PR preview deployments for QA before production.
- Keep rollback notes in the final response when a deployment is involved.

## Shared Notes

Use `docs/codex-shared-notes.md` as the shared notebook between Desktop Codex and Cloud Codex.

- Read it before project setup, environment, deployment, or cross-agent workflow changes.
- Update it when durable project context changes.
- Keep task-specific scratch notes out of it unless they affect future work.

## Environment Guidance

Recommended environment model:

- `main`: production source for `cubiqo.ai` / `www.cubiqo.ai`.
- Pull request previews: QA for proposed changes.
- Optional `staging` branch or separate Vercel project: stable pre-production, if the project grows beyond personal workflow.
- Separate Vercel project/workspace: experiments such as the plasma/cuboid visual.

## Desktop And Cloud Codex Sync

GitHub is the source of truth between Desktop Codex and Cloud Codex.

- Desktop-only local changes are invisible to Cloud Codex until committed and pushed.
- Cloud Codex changes are invisible locally until fetched or pulled.
- Use branches and PRs to hand work between Desktop and Cloud Codex.
- Use this Desktop workspace for local visual QA, screenshots, and hands-on debugging.
- Use Cloud Codex for clean repo changes, CI fixes, and pull request workflows.

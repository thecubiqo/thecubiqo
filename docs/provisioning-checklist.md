# Browser/Cloud Codex Provisioning Checklist

This checklist tracks provisioning for the **primary CubiQo production app** only.

- Vercel project: `cubiqo-repo`
- Project/product name: `cq.ai`
- Domains: `cubiqo.ai`, `www.cubiqo.ai`
- GitHub repo: `thecubiqo/thecubiqo`

## Status matrix

| Item | Status | Notes |
|---|---|---|
| GitHub repo connected | Verified locally | `origin` is configured for `https://github.com/thecubiqo/thecubiqo.git`. |
| Can create branches | Verified locally | Local git branch operations are available. |
| Can open PRs | Needs owner verification | `gh` CLI is not installed in this container. |
| Vercel PR previews enabled | Needs owner verification | `vercel` CLI is not installed in this container. |
| Correct project responsibility documented: `cq.ai` / `cubiqo-repo` | Verified | Project/product name and Vercel project are documented in `AGENTS.md`. |
| AGENTS.md committed to repo | In progress | This PR adds `AGENTS.md`. |
| Branch protection on main | Needs owner verification | Must be checked in GitHub settings. |
| Required checks/builds configured | Needs owner verification | Must be checked in branch protection / Actions rulesets. |
| Preview URL appears on PRs | Needs owner verification | Validate on next PR in GitHub conversation/timeline. |
| No access to unrelated experimental project unless explicitly needed | Verified policy | Enforced via `AGENTS.md` scope policy. |
| Clear PR review/merge/deploy policy | Needs owner verification | Confirm in repo docs/settings. |

## Owner verification steps
1. In GitHub repo `thecubiqo/thecubiqo`, confirm branch push permissions.
2. Open a test PR and verify:
   - required checks trigger,
   - Vercel preview comment appears,
   - merge policy aligns with team rules.
3. In Vercel (`cubiqo-repo`), verify both `cubiqo.ai` and `www.cubiqo.ai` are attached to production project.
4. Confirm `main` branch protection and required checks in GitHub Settings → Branches (or Rulesets).

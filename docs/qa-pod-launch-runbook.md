# QA POD Launch Runbook (Apliiq + Shopify + Website)

This runbook keeps work dedicated to the **thecubiqo** project and separates responsibilities between Cloud Codex and Desktop (logged-in browser) sessions.

## Scope
- Environment: **QA / development only**.
- No production deploys, no production credentials, and no real fulfillment without explicit approval.

## Responsibilities

### Cloud Codex (this environment)
- Code changes only in this repository.
- Build/lint/typecheck/test before completion.
- Create PRs for all changes.
- Do not perform direct Shopify Admin/Apliiq browser actions.

### Desktop Codex / Human Operator (logged-in browser)
- Create POD designs in Apliiq.
- Sync/publish products into Shopify dev/test store.
- Validate product media/options/pricing in Shopify Admin.
- Execute storefront QA in preview/local browser.

## Execution Steps

1. **Create POD designs in Apliiq (Desktop)**
   - Create designs and map to intended garments.
   - Confirm mockups and print placements.

2. **Push products to Shopify dev store (Desktop)**
   - Publish only to QA/dev channel.
   - Verify title, handle, options, variants, images, pricing.

3. **Collect product metadata (Desktop)**
   - Share product handles.
   - Share collection handles/tags used for storefront placement.

4. **Website integration and verification (Cloud)**
   - Ensure product/collection queries render expected items.
   - Adjust mappings, filtering, and fallbacks if needed.
   - Run checks and push PR updates.

5. **Storefront QA (Desktop)**
   - Product listing visibility.
   - PDP images and variant selector.
   - Cart add/update/remove.
   - Checkout redirect smoke test (no real payment).
   - Mobile/tablet/desktop checks.

## Safety Guardrails
- Never place real orders/payments without approval.
- Never trigger real Apliiq fulfillment without approval.
- Never change Shopify production settings without approval.
- Keep secrets out of repo files; use platform env vars.

## Change Log Template
Use this block after each QA iteration:

```md
### QA Iteration YYYY-MM-DD
- Apliiq products created:
- Shopify product handles:
- Shopify collection handles:
- Website preview URL:
- Issues found:
- Fix PR:
- Re-test status:
```

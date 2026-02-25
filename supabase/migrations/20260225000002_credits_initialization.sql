-- Credits Initialization for CubiQo Platform
--
-- Seeds the credits table for the cubiqo.dev organization so that the
-- Orchestrator can authorize tool usage (e.g. "Generate Image", "Deploy").
-- Without a credits record, all tool operations are blocked.
--
-- This migration is idempotent — it only inserts if the org doesn't
-- already have a credits record.

-- 1. Ensure the cubiqo.dev platform organization exists
INSERT INTO organizations (name, slug, plan)
VALUES ('CubiQo Platform', 'cubiqo-dev', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed credits for the cubiqo-dev organization
-- Uses a subquery to find the org_id dynamically
INSERT INTO credits (org_id, balance)
SELECT id, 10000.00
FROM organizations
WHERE slug = 'cubiqo-dev'
  AND NOT EXISTS (
    SELECT 1 FROM credits WHERE credits.org_id = organizations.id
  );

-- 3. Record the initial credit transaction
INSERT INTO credit_transactions (org_id, amount, balance_after, transaction_type, description, metadata)
SELECT id, 10000.00, 10000.00, 'bonus', 'Platform initialization credits for cubiqo.dev', '{"source": "migration", "reason": "platform_seed"}'::jsonb
FROM organizations
WHERE slug = 'cubiqo-dev'
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions
    WHERE credit_transactions.org_id = organizations.id
      AND credit_transactions.description = 'Platform initialization credits for cubiqo.dev'
  );

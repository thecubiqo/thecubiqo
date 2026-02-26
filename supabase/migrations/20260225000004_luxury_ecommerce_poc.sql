-- =============================================================================
-- LUXURY E-COMMERCE POC INFRASTRUCTURE (REFINED V2)
-- =============================================================================
-- Description: Adds tables for Marketing, Sales, and Growth Analytics.
--              Includes a "Shadow View" system to bridge the gap between 
--              legacy Cubiqo tables and the new Emergent prefixed types.
-- =============================================================================

-- 1. COMPATIBILITY SHADOW VIEWS
CREATE OR REPLACE VIEW emergent_projects AS SELECT * FROM projects;
CREATE OR REPLACE VIEW emergent_orgs AS SELECT * FROM organizations;
CREATE OR REPLACE VIEW emergent_org_members AS SELECT * FROM org_members;
CREATE OR REPLACE VIEW emergent_playbooks AS SELECT * FROM playbooks;

-- 2. MARKETING CAMPAIGNS (Emergent Marketing Agent)
CREATE TABLE IF NOT EXISTS emergent_marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'twitter', 'linkedin', 'facebook', 'email', 'tiktok')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  content_type VARCHAR(50) DEFAULT 'image' CHECK (content_type IN ('text', 'image', 'video', 'carousel', 'hologram')),
  
  -- Flexible content and metrics
  content_json JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{"reach": 0, "clicks": 0, "conversions": 0}'::jsonb,
  
  scheduled_at TIMESTAMPTZ,
  spend_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Metadata
  created_by UUID, -- Optional, can be NULL for system actions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SALES LEADS (Emergent Sales Agent)
CREATE TABLE IF NOT EXISTS emergent_sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'pitching', 'negotiating', 'won', 'lost', 'nurture')),
  
  -- Monitoring
  last_outreach_at TIMESTAMPTZ,
  outreach_history JSONB DEFAULT '[]',
  
  -- Lead enrichment
  source TEXT,
  notes TEXT,
  lead_score INTEGER DEFAULT 0,
  
  -- Metadata
  assigned_to UUID, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GROWTH INSIGHTS
CREATE TABLE IF NOT EXISTS emergent_growth_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  recommendation TEXT,
  impact_score INTEGER DEFAULT 0,
  category VARCHAR(50) DEFAULT 'general',
  is_executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SEED DATA: Luxury Brand Playbook
-- Ensures the "Luxury Mode" is fully documented in the system
INSERT INTO playbooks (name, slug, service, title, description, instructions, categories)
VALUES (
  'Luxury Brand E-commerce',
  'luxury-ecomm-v1',
  'custom',
  'The Silent Luxury Framework',
  'Ultra-high-end e-commerce stack focusing on minimalism, framer-motion animations, and white-glove UX.',
  'Follow these rules: 1. Use HSL colors only. 2. Typography must be serif for headings. 3. Every interaction must have a 0.5s spring animation. 4. Prioritize "The Aura" branding.',
  ARRAY['ecommerce', 'luxury', 'premium']
) ON CONFLICT (slug) DO UPDATE SET instructions = EXCLUDED.instructions;

-- 6. RLS POLICIES
ALTER TABLE emergent_marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_growth_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their marketing campaigns" ON emergent_marketing_campaigns
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their sales leads" ON emergent_sales_leads
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view growth insights" ON emergent_growth_insights
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- 7. TRIGGERS
CREATE TRIGGER trigger_marketing_updated_at
  BEFORE UPDATE ON emergent_marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sales_leads_updated_at
  BEFORE UPDATE ON emergent_sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

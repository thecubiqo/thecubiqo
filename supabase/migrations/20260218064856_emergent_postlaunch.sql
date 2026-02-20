-- =============================================================================
-- EMERGENT POST-LAUNCH SYSTEM MIGRATION
-- =============================================================================
-- Description: Tables for analytics, SEO, commerce, monitoring, and post-launch features
-- Author: GUY (Database Administrator)
-- Date: 2026-02-18
-- Version: 1.0.0
-- =============================================================================

-- =============================================================================
-- 1. ANALYTICS EVENTS (User Behavior Tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Event identity
  event_name VARCHAR(100) NOT NULL, -- e.g., 'page_view', 'button_click', 'form_submit'
  event_category VARCHAR(50), -- e.g., 'engagement', 'conversion', 'error'
  
  -- Session tracking
  session_id VARCHAR(255),
  user_id VARCHAR(255), -- End-user ID (not our system user)
  anonymous_id VARCHAR(255),
  
  -- Page context
  page_url TEXT,
  page_title VARCHAR(500),
  referrer TEXT,
  
  -- Device & location
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- Location (approximate)
  country VARCHAR(2), -- ISO country code
  region VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(100),
  
  -- Event data
  properties JSONB DEFAULT '{}', -- Custom event properties
  
  -- Performance
  page_load_time_ms INTEGER,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes (optimized for analytics queries)
CREATE INDEX idx_analytics_events_project_id ON analytics_events(project_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

-- Composite indexes for common analytics queries
CREATE INDEX idx_analytics_events_project_event_time ON analytics_events(project_id, event_name, created_at DESC);
CREATE INDEX idx_analytics_events_project_time ON analytics_events(project_id, created_at DESC);

-- Partitioning by month (for performance)
-- Note: Partitioning would be implemented separately based on data volume

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view analytics for their projects
CREATE POLICY "Users can view project analytics" ON analytics_events
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Service role can insert events (from public tracking)
-- Note: Insert policy managed via service role key

-- =============================================================================
-- 2. SEO METADATA (Per-Page SEO Configuration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Page identity
  page_path VARCHAR(500) NOT NULL, -- e.g., '/', '/about', '/products/:id'
  page_type VARCHAR(50) DEFAULT 'page' CHECK (page_type IN ('page', 'article', 'product', 'collection', 'custom')),
  
  -- Basic SEO
  title VARCHAR(255),
  description TEXT,
  keywords TEXT[],
  
  -- Open Graph
  og_title VARCHAR(255),
  og_description TEXT,
  og_image VARCHAR(500),
  og_type VARCHAR(50) DEFAULT 'website',
  
  -- Twitter Card
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image' CHECK (twitter_card IN ('summary', 'summary_large_image', 'app', 'player')),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image VARCHAR(500),
  twitter_creator VARCHAR(100),
  
  -- Schema.org structured data
  schema_markup JSONB,
  
  -- Robots
  robots_index BOOLEAN DEFAULT TRUE,
  robots_follow BOOLEAN DEFAULT TRUE,
  canonical_url VARCHAR(500),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, page_path)
);

-- Indexes
CREATE INDEX idx_seo_metadata_project_id ON seo_metadata(project_id);
CREATE INDEX idx_seo_metadata_page_path ON seo_metadata(page_path);
CREATE INDEX idx_seo_metadata_page_type ON seo_metadata(page_type);

-- Trigger for updated_at
CREATE TRIGGER seo_metadata_updated_at
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage SEO for their projects
CREATE POLICY "Users can view project seo" ON seo_metadata
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage seo" ON seo_metadata
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 3. COMMERCE ORDERS (E-commerce Transactions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS commerce_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  
  -- Order identity
  order_number VARCHAR(100) UNIQUE NOT NULL,
  external_order_id VARCHAR(255), -- ID in external system (Shopify, etc.)
  
  -- Customer
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_id VARCHAR(255), -- External customer ID
  
  -- Amounts
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER DEFAULT 0,
  shipping_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'paid', 'fulfilled', 'canceled', 'refunded')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded')),
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'canceled')),
  
  -- Payment
  payment_method VARCHAR(50), -- e.g., 'credit_card', 'paypal', 'stripe'
  payment_intent_id VARCHAR(255), -- Stripe payment intent
  payment_transaction_id VARCHAR(255),
  
  -- Shipping address
  shipping_name VARCHAR(255),
  shipping_address_line1 VARCHAR(500),
  shipping_address_line2 VARCHAR(500),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(2),
  
  -- Billing address
  billing_name VARCHAR(255),
  billing_address_line1 VARCHAR(500),
  billing_address_line2 VARCHAR(500),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2),
  
  -- Tracking
  tracking_number VARCHAR(255),
  tracking_url VARCHAR(500),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Notes
  customer_note TEXT,
  internal_note TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  canceled_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_commerce_orders_project_id ON commerce_orders(project_id);
CREATE INDEX idx_commerce_orders_order_number ON commerce_orders(order_number);
CREATE INDEX idx_commerce_orders_customer_email ON commerce_orders(customer_email);
CREATE INDEX idx_commerce_orders_status ON commerce_orders(order_status, payment_status);
CREATE INDEX idx_commerce_orders_created_at ON commerce_orders(created_at DESC);
CREATE INDEX idx_commerce_orders_external_id ON commerce_orders(external_order_id);

-- Trigger for updated_at
CREATE TRIGGER commerce_orders_updated_at
  BEFORE UPDATE ON commerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE commerce_orders ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view orders for their projects
CREATE POLICY "Users can view project orders" ON commerce_orders
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 4. ORDER ITEMS (Line Items for Orders)
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
  
  -- Item identity
  product_id VARCHAR(255), -- External product ID
  variant_id VARCHAR(255), -- External variant ID
  sku VARCHAR(100),
  
  -- Item details
  product_name VARCHAR(500) NOT NULL,
  variant_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  
  -- Pricing
  unit_price_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL,
  tax_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  
  -- Fulfillment
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'canceled')),
  fulfilled_at TIMESTAMP,
  
  -- Product details
  image_url VARCHAR(500),
  weight_grams INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view order items for their orders
CREATE POLICY "Users can view order items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM commerce_orders WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 5. UPTIME MONITORS (Site Availability Tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS uptime_monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Monitor config
  monitor_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  check_interval_seconds INTEGER NOT NULL DEFAULT 300, -- 5 minutes
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Expected response
  expected_status_code INTEGER DEFAULT 200,
  expected_body_contains TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  current_status VARCHAR(50) DEFAULT 'unknown' CHECK (current_status IN ('up', 'down', 'degraded', 'unknown')),
  
  -- Stats
  uptime_percentage DECIMAL(5, 2),
  last_check_at TIMESTAMP,
  last_up_at TIMESTAMP,
  last_down_at TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Alerting
  alert_threshold INTEGER DEFAULT 3, -- Alert after N consecutive failures
  alert_email VARCHAR(255),
  alert_slack_webhook VARCHAR(500),
  
  -- Metadata
  created_by UUID, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, url)
);

-- Indexes
CREATE INDEX idx_uptime_monitors_project_id ON uptime_monitors(project_id);
CREATE INDEX idx_uptime_monitors_is_active ON uptime_monitors(is_active);
CREATE INDEX idx_uptime_monitors_last_check ON uptime_monitors(last_check_at);

-- Trigger for updated_at
CREATE TRIGGER uptime_monitors_updated_at
  BEFORE UPDATE ON uptime_monitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE uptime_monitors ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage monitors for their projects
CREATE POLICY "Users can view project monitors" ON uptime_monitors
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage monitors" ON uptime_monitors
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 6. UPTIME CHECKS (Historical Check Results)
-- =============================================================================

CREATE TABLE IF NOT EXISTS uptime_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES uptime_monitors(id) ON DELETE CASCADE,
  
  -- Check result
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure', 'timeout')),
  http_status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Error info
  error_message TEXT,
  error_type VARCHAR(100),
  
  -- Metadata
  checked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uptime_checks_monitor_id ON uptime_checks(monitor_id);
CREATE INDEX idx_uptime_checks_checked_at ON uptime_checks(checked_at DESC);
CREATE INDEX idx_uptime_checks_status ON uptime_checks(status);

-- Composite index for recent checks
CREATE INDEX idx_uptime_checks_monitor_time ON uptime_checks(monitor_id, checked_at DESC);

-- RLS
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view checks for their monitors
CREATE POLICY "Users can view uptime checks" ON uptime_checks
  FOR SELECT
  USING (
    monitor_id IN (
      SELECT id FROM uptime_monitors WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 7. ERROR TRACKING (Application Errors & Exceptions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Error identity
  error_hash VARCHAR(64) UNIQUE, -- Hash of error signature for grouping
  error_type VARCHAR(255) NOT NULL, -- e.g., 'TypeError', 'NetworkError'
  error_message TEXT NOT NULL,
  
  -- Stack trace
  stack_trace TEXT,
  
  -- Context
  environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production')),
  url TEXT,
  user_agent TEXT,
  
  -- User context
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  
  -- Occurrence count (for grouped errors)
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Status
  status VARCHAR(50) DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'ignored')),
  resolved_at TIMESTAMP,
  resolved_by UUID, -- References auth.users
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_logs_project_id ON error_logs(project_id);
CREATE INDEX idx_error_logs_error_hash ON error_logs(error_hash);
CREATE INDEX idx_error_logs_status ON error_logs(status);
CREATE INDEX idx_error_logs_last_seen ON error_logs(last_seen_at DESC);
CREATE INDEX idx_error_logs_environment ON error_logs(environment);

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view errors for their projects
CREATE POLICY "Users can view project errors" ON error_logs
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Members can resolve errors
CREATE POLICY "Members can manage errors" ON error_logs
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 8. PERFORMANCE METRICS (Web Vitals & Performance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Page context
  page_url TEXT NOT NULL,
  
  -- Core Web Vitals
  lcp_ms INTEGER, -- Largest Contentful Paint
  fid_ms INTEGER, -- First Input Delay
  cls DECIMAL(5, 3), -- Cumulative Layout Shift
  
  -- Other metrics
  fcp_ms INTEGER, -- First Contentful Paint
  ttfb_ms INTEGER, -- Time to First Byte
  
  -- Device context
  device_type VARCHAR(50),
  connection_type VARCHAR(50),
  
  -- Session
  session_id VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_performance_metrics_project_id ON performance_metrics(project_id);
CREATE INDEX idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

-- RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view metrics for their projects
CREATE POLICY "Users can view project metrics" ON performance_metrics
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update order totals when items change
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal INTEGER;
  v_tax INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(total_price_cents), 0),
    COALESCE(SUM(tax_cents), 0)
  INTO v_subtotal, v_tax
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Update order totals
  UPDATE commerce_orders
  SET 
    subtotal_cents = v_subtotal,
    tax_cents = v_tax,
    total_cents = v_subtotal + v_tax + shipping_cents - discount_cents,
    updated_at = NOW()
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_totals();

-- Function to update uptime monitor stats
CREATE OR REPLACE FUNCTION update_uptime_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_checks INTEGER;
  v_successful_checks INTEGER;
  v_uptime_pct DECIMAL(5, 2);
BEGIN
  -- Calculate uptime percentage from last 30 days
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'success')
  INTO v_total_checks, v_successful_checks
  FROM uptime_checks
  WHERE monitor_id = NEW.monitor_id
  AND checked_at > NOW() - INTERVAL '30 days';
  
  IF v_total_checks > 0 THEN
    v_uptime_pct := (v_successful_checks::DECIMAL / v_total_checks) * 100;
  ELSE
    v_uptime_pct := 100;
  END IF;
  
  -- Update monitor
  UPDATE uptime_monitors
  SET 
    uptime_percentage = v_uptime_pct,
    last_check_at = NEW.checked_at,
    current_status = CASE 
      WHEN NEW.status = 'success' THEN 'up'
      ELSE 'down'
    END,
    last_up_at = CASE 
      WHEN NEW.status = 'success' THEN NEW.checked_at
      ELSE last_up_at
    END,
    last_down_at = CASE 
      WHEN NEW.status != 'success' THEN NEW.checked_at
      ELSE last_down_at
    END,
    consecutive_failures = CASE 
      WHEN NEW.status = 'success' THEN 0
      ELSE consecutive_failures + 1
    END,
    updated_at = NOW()
  WHERE id = NEW.monitor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uptime_checks_update_stats
  AFTER INSERT ON uptime_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_uptime_stats();

-- Function to group duplicate errors
CREATE OR REPLACE FUNCTION group_error_logs()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_error_id UUID;
BEGIN
  -- Check if error with same hash already exists
  SELECT id INTO v_existing_error_id
  FROM error_logs
  WHERE error_hash = NEW.error_hash
  AND project_id = NEW.project_id
  AND status = 'unresolved'
  LIMIT 1;
  
  IF v_existing_error_id IS NOT NULL THEN
    -- Update existing error
    UPDATE error_logs
    SET 
      occurrence_count = occurrence_count + 1,
      last_seen_at = NOW()
    WHERE id = v_existing_error_id;
    
    -- Don't insert new row
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER error_logs_group_duplicates
  BEFORE INSERT ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION group_error_logs();

-- =============================================================================
-- VIEWS (Convenience Queries)
-- =============================================================================

-- Project analytics summary
CREATE OR REPLACE VIEW project_analytics_summary AS
SELECT 
  p.id AS project_id,
  p.name AS project_name,
  COUNT(DISTINCT ae.session_id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '7 days') AS sessions_7d,
  COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '7 days') AS unique_users_7d,
  COUNT(ae.id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '7 days') AS pageviews_7d,
  AVG(pm.lcp_ms) FILTER (WHERE pm.created_at > NOW() - INTERVAL '7 days') AS avg_lcp_7d,
  COUNT(el.id) FILTER (WHERE el.last_seen_at > NOW() - INTERVAL '7 days' AND el.status = 'unresolved') AS unresolved_errors_7d
FROM projects p
LEFT JOIN analytics_events ae ON p.id = ae.project_id
LEFT JOIN performance_metrics pm ON p.id = pm.project_id
LEFT JOIN error_logs el ON p.id = el.project_id
GROUP BY p.id, p.name;

-- Order summary by project
CREATE OR REPLACE VIEW project_order_summary AS
SELECT 
  p.id AS project_id,
  p.name AS project_name,
  COUNT(co.id) AS total_orders,
  COUNT(co.id) FILTER (WHERE co.order_status = 'fulfilled') AS fulfilled_orders,
  SUM(co.total_cents) FILTER (WHERE co.payment_status = 'paid') / 100.0 AS total_revenue,
  AVG(co.total_cents) FILTER (WHERE co.payment_status = 'paid') / 100.0 AS avg_order_value
FROM projects p
LEFT JOIN commerce_orders co ON p.id = co.project_id
GROUP BY p.id, p.name;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE analytics_events IS 'User behavior tracking and analytics events';
COMMENT ON TABLE seo_metadata IS 'Per-page SEO configuration and Open Graph data';
COMMENT ON TABLE commerce_orders IS 'E-commerce orders and transactions';
COMMENT ON TABLE order_items IS 'Line items for commerce orders';
COMMENT ON TABLE uptime_monitors IS 'Site availability monitoring configuration';
COMMENT ON TABLE uptime_checks IS 'Historical uptime check results';
COMMENT ON TABLE error_logs IS 'Application errors and exceptions tracking';
COMMENT ON TABLE performance_metrics IS 'Web Vitals and performance metrics';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

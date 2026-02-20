-- Enhanced Admin Dashboard Schema
-- Created: 2026-02-18
-- Purpose: Comprehensive admin dashboard with user management, security, analytics, and monitoring

-- ============================================================================
-- SECURITY ALERTS TABLE
-- Track security incidents, failed logins, and suspicious activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  alert_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security alert queries
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

COMMENT ON TABLE security_alerts IS 'Security incidents, failed logins, and suspicious activities';
COMMENT ON COLUMN security_alerts.alert_type IS 'Type: failed_login, brute_force, suspicious_activity, fraud_detected, etc.';

-- ============================================================================
-- USER ACTIVITY LOG TABLE
-- Detailed tracking of user interactions with the platform
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  channel TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);

COMMENT ON TABLE user_activity_log IS 'Detailed user interaction tracking';

-- ============================================================================
-- TRANSACTIONS TABLE
-- Track financial transactions and payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
  payment_method TEXT,
  transaction_data JSONB DEFAULT '{}'::jsonb,
  fraud_score DECIMAL(5, 2),
  flagged_for_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_flagged ON transactions(flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

COMMENT ON TABLE transactions IS 'Financial transactions and payment tracking';
COMMENT ON COLUMN transactions.fraud_score IS 'Fraud probability score (0-100)';

-- ============================================================================
-- AI MODEL PERFORMANCE TABLE
-- Track AI model metrics, response times, and quality
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT,
  request_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL(10, 2),
  avg_tokens_used DECIMAL(10, 2),
  avg_quality_score DECIMAL(5, 2),
  uptime_percentage DECIMAL(5, 2),
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  metrics_data JSONB DEFAULT '{}'::jsonb,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, date)
);

-- Indexes for AI performance queries
CREATE INDEX IF NOT EXISTS idx_ai_performance_model ON ai_model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_performance_date ON ai_model_performance(date DESC);

COMMENT ON TABLE ai_model_performance IS 'Daily AI model performance metrics';

-- ============================================================================
-- INTEGRATION HEALTH TABLE
-- Monitor external service integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'maintenance')),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2),
  health_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_name)
);

-- Indexes for integration health queries
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);
CREATE INDEX IF NOT EXISTS idx_integration_health_type ON integration_health(integration_type);

COMMENT ON TABLE integration_health IS 'External integration monitoring';

-- ============================================================================
-- FRAUD DETECTION RULES TABLE
-- Configurable fraud detection rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL,
  rule_condition JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('flag', 'block', 'notify', 'review')),
  enabled BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fraud rules
CREATE INDEX IF NOT EXISTS idx_fraud_rules_enabled ON fraud_detection_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_fraud_rules_type ON fraud_detection_rules(rule_type);

COMMENT ON TABLE fraud_detection_rules IS 'Configurable fraud detection rules';

-- ============================================================================
-- SYSTEM HEALTH METRICS TABLE
-- Track system-wide health and performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15, 2),
  metric_unit TEXT,
  metric_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_health_metrics(timestamp DESC);

COMMENT ON TABLE system_health_metrics IS 'System-wide health and performance metrics';

-- ============================================================================
-- COMPLIANCE REPORTS TABLE
-- Store generated compliance reports (GDPR, CCPA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_format TEXT NOT NULL CHECK (report_format IN ('pdf', 'json', 'csv', 'html')),
  report_data JSONB DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for compliance reports
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_by ON compliance_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON compliance_reports(created_at DESC);

COMMENT ON TABLE compliance_reports IS 'Generated compliance reports';

-- ============================================================================
-- INCIDENT RESPONSE LOG TABLE
-- Track security incidents and responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_response_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES security_alerts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for incident response
CREATE INDEX IF NOT EXISTS idx_incident_response_incident_id ON incident_response_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_response_performed_by ON incident_response_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_incident_response_created_at ON incident_response_log(created_at DESC);

COMMENT ON TABLE incident_response_log IS 'Security incident response actions';

-- ============================================================================
-- PLATFORM SETTINGS TABLE
-- Global platform configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL,
  description TEXT,
  last_updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for settings lookup
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

COMMENT ON TABLE platform_settings IS 'Global platform configuration';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- All admin tables require is_admin = true
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_response_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view security alerts" ON security_alerts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage security alerts" ON security_alerts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view user activity" ON user_activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view transactions" ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view AI performance" ON ai_model_performance FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view integration health" ON integration_health FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage fraud rules" ON fraud_detection_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view system metrics" ON system_health_metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage compliance reports" ON compliance_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can view incident responses" ON incident_response_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage platform settings" ON platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Service role can insert activity logs (bypasses RLS)
CREATE POLICY "Service role can insert activity logs" ON user_activity_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert security alerts" ON security_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert system metrics" ON system_health_metrics FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_session_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_channel TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    session_id,
    activity_type,
    activity_data,
    channel,
    ip_address,
    user_agent,
    duration_ms
  ) VALUES (
    p_user_id,
    p_session_id,
    p_activity_type,
    p_activity_data,
    p_channel,
    p_ip_address,
    p_user_agent,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated, anon;

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_alert_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO security_alerts (
    alert_type,
    severity,
    user_id,
    user_email,
    ip_address,
    user_agent,
    alert_data
  ) VALUES (
    p_alert_type,
    p_severity,
    p_user_id,
    p_user_email,
    p_ip_address,
    p_user_agent,
    p_alert_data
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_security_alert TO authenticated, anon;

-- Function to update AI model performance
CREATE OR REPLACE FUNCTION update_ai_model_performance(
  p_model_name TEXT,
  p_model_version TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_response_time_ms DECIMAL DEFAULT NULL,
  p_tokens_used DECIMAL DEFAULT NULL,
  p_quality_score DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update daily metrics
  INSERT INTO ai_model_performance (
    model_name,
    model_version,
    request_count,
    success_count,
    failure_count,
    avg_response_time_ms,
    avg_tokens_used,
    avg_quality_score,
    last_success_at,
    last_failure_at,
    date
  ) VALUES (
    p_model_name,
    p_model_version,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    COALESCE(p_response_time_ms, 0),
    COALESCE(p_tokens_used, 0),
    COALESCE(p_quality_score, 0),
    CASE WHEN p_success THEN NOW() ELSE NULL END,
    CASE WHEN NOT p_success THEN NOW() ELSE NULL END,
    v_current_date
  )
  ON CONFLICT (model_name, date) 
  DO UPDATE SET
    request_count = ai_model_performance.request_count + 1,
    success_count = ai_model_performance.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = ai_model_performance.failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
    avg_response_time_ms = (
      (ai_model_performance.avg_response_time_ms * ai_model_performance.request_count + COALESCE(p_response_time_ms, 0)) / 
      (ai_model_performance.request_count + 1)
    ),
    avg_tokens_used = (
      (ai_model_performance.avg_tokens_used * ai_model_performance.request_count + COALESCE(p_tokens_used, 0)) / 
      (ai_model_performance.request_count + 1)
    ),
    avg_quality_score = CASE 
      WHEN p_quality_score IS NOT NULL THEN
        (COALESCE(ai_model_performance.avg_quality_score, 0) * ai_model_performance.request_count + p_quality_score) / 
        (ai_model_performance.request_count + 1)
      ELSE ai_model_performance.avg_quality_score
    END,
    uptime_percentage = (
      (ai_model_performance.success_count + CASE WHEN p_success THEN 1 ELSE 0 END)::DECIMAL / 
      (ai_model_performance.request_count + 1) * 100
    ),
    last_success_at = CASE WHEN p_success THEN NOW() ELSE ai_model_performance.last_success_at END,
    last_failure_at = CASE WHEN NOT p_success THEN NOW() ELSE ai_model_performance.last_failure_at END,
    updated_at = NOW()
  RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_ai_model_performance TO authenticated, anon;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON security_alerts TO anon, authenticated;
GRANT ALL ON user_activity_log TO anon, authenticated;
GRANT ALL ON transactions TO anon, authenticated;
GRANT ALL ON ai_model_performance TO anon, authenticated;
GRANT ALL ON integration_health TO anon, authenticated;
GRANT ALL ON fraud_detection_rules TO anon, authenticated;
GRANT ALL ON system_health_metrics TO anon, authenticated;
GRANT ALL ON compliance_reports TO anon, authenticated;
GRANT ALL ON incident_response_log TO anon, authenticated;
GRANT ALL ON platform_settings TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default fraud detection rules
INSERT INTO fraud_detection_rules (rule_name, rule_type, rule_condition, severity, action) VALUES
  ('Multiple Failed Logins', 'authentication', '{"threshold": 5, "window_minutes": 10}'::jsonb, 'high', 'block'),
  ('Unusual Transaction Amount', 'transaction', '{"amount_threshold": 10000, "deviation_multiplier": 3}'::jsonb, 'high', 'review'),
  ('Rapid Successive Transactions', 'transaction', '{"count": 5, "window_seconds": 60}'::jsonb, 'medium', 'flag'),
  ('Geographic Anomaly', 'location', '{"distance_km": 1000, "time_window_hours": 1}'::jsonb, 'medium', 'notify'),
  ('Suspicious API Usage', 'api', '{"rate_limit": 100, "window_seconds": 60}'::jsonb, 'low', 'flag')
ON CONFLICT (rule_name) DO NOTHING;

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('maintenance_mode', 'false'::jsonb, 'boolean', 'Enable/disable maintenance mode'),
  ('geo_fencing_enabled', 'true'::jsonb, 'boolean', 'Enable geographic restrictions'),
  ('allowed_countries', '["US", "CA", "UK", "IN"]'::jsonb, 'array', 'List of allowed country codes'),
  ('max_login_attempts', '5'::jsonb, 'number', 'Maximum login attempts before lockout'),
  ('session_timeout_minutes', '30'::jsonb, 'number', 'Session timeout in minutes'),
  ('fraud_detection_enabled', 'true'::jsonb, 'boolean', 'Enable fraud detection system'),
  ('mfa_required_for_admins', 'true'::jsonb, 'boolean', 'Require MFA for admin accounts'),
  ('data_retention_days', '90'::jsonb, 'number', 'Data retention period in days')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

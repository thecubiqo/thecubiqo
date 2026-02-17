-- Add Self-Healing Feature (32nd Feature)
-- Created: 2026-02-17
-- Purpose: Complete the 32-feature set by adding the verified Self-Healing Architecture

INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('system.self_healing', 'Self-Healing Architecture', 'Automated diagnostics, 10 AM daily reports, and rollback patch generation', 'admin', 'toggle', true, 'safe', '{"icon": "🚑", "schedule": "10:00 AM daily"}');

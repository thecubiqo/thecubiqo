-- Add Agent and Integration Features
-- Created: 2026-02-17
-- Purpose: Add missing features from Onboarding and Agents work

-- Agents Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('agents.core_agents', 'AI Agents', 'Enable autonomous AI agents for task automation', 'utility', 'toggle', true, 'safe', '{"icon": "🤖"}'),
  ('agents.code_execution', 'Code Execution', 'Allow agents to execute code in sandboxed environment', 'utility', 'toggle', false, 'dangerous', '{"icon": "💻"}'),
  ('agents.file_management', 'File Management', 'Enable file upload and management capabilities', 'utility', 'toggle', true, 'safe', '{"icon": "📁"}'),
  ('agents.memory_context', 'Memory & Context', 'Remember conversations and learn from interactions', 'utility', 'toggle', true, 'safe', '{"icon": "🧠"}'),
  ('agents.marketing', 'Marketing Agent', 'Specialized agent for marketing content creation', 'utility', 'toggle', true, 'safe', '{"icon": "📢"}');

-- Integrations
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('integration.github', 'GitHub Integration', 'Access repositories and manage code', 'utility', 'toggle', false, 'warning', '{"icon": "🐙"}'),
  ('integration.google', 'Google Integration', 'Integrate with Gmail, Drive, and Calendar', 'utility', 'toggle', false, 'warning', '{"icon": "🔍"}'),
  ('integration.slack', 'Slack Integration', 'Send notifications and manage workspace', 'utility', 'toggle', false, 'warning', '{"icon": "💬"}');

-- Agent Admin Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('admin.agent_portal', 'Agent Portal', 'Dashboard for monitoring agent activities', 'admin', 'toggle', true, 'safe', '{"icon": "📊"}'),
  ('admin.agent_reporting', 'Agent Reporting', 'Detailed reporting system for agent actions', 'admin', 'toggle', true, 'safe', '{"icon": "📋"}');

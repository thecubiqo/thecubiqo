-- ============================================================================
-- Autopilot Sci-Fi Features
-- Adds CubiQo Autopilot features to the features catalog.
-- These are sci-fi capabilities where CubiQo does real work for users:
--   - Autonomous profile filling from chat conversations
--   - Background agent tasks running simultaneously while chatting
--   - Research, summarize, and organize tasks
-- ============================================================================

-- Add autopilot features to the features catalog
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config)
VALUES
  (
    'cubiqo_autopilot',
    'CubiQo Autopilot',
    'Enable autonomous actions while chatting. CubiQo can do real work in the background - filling your profile, researching topics, and organizing information simultaneously.',
    'utility',
    'toggle',
    true,
    'safe',
    '{"sci_fi": true, "description_long": "The core autopilot engine that enables CubiQo to perform background tasks while maintaining natural conversation with the user."}'::jsonb
  ),
  (
    'profile_auto_fill',
    'Profile Auto-Fill',
    'CubiQo automatically fills your profile from conversation data. As you chat, your name, interests, location, and preferences are extracted and saved to your profile.',
    'utility',
    'toggle',
    true,
    'safe',
    '{"sci_fi": true, "requires": "cubiqo_autopilot", "description_long": "Extracts profile-relevant information from natural conversation and autonomously updates the user profile. Works silently in the background."}'::jsonb
  ),
  (
    'background_agents',
    'Background Agents',
    'Spawn background AI agents from chat context. While you chat with CubiQo, specialized agents can research topics, summarize conversations, and organize your data simultaneously.',
    'utility',
    'toggle',
    false,
    'warning',
    '{"sci_fi": true, "requires": "cubiqo_autopilot", "description_long": "Allows the chat system to spawn background agent tasks. Agents run asynchronously and report results back to the conversation."}'::jsonb
  ),
  (
    'autopilot_research',
    'Autopilot Research',
    'CubiQo can autonomously research topics mentioned in conversation and provide insights in the background.',
    'utility',
    'toggle',
    false,
    'warning',
    '{"sci_fi": true, "requires": "background_agents", "description_long": "When enabled, CubiQo detects research-worthy topics in conversation and spawns background agents to gather and summarize relevant information."}'::jsonb
  )
ON CONFLICT (feature_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  config = EXCLUDED.config;

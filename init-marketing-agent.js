#!/usr/bin/env node

/**
 * Script to initialize the marketing agent
 * Run this to create a marketing agent instance for testing
 */

console.log('🚀 Initializing Marketing Agent\n');

const agentConfig = {
  id: 'marketing-agent',
  name: 'Marketing Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    temperature: 0.7,
  },
  tools: ['web-search', 'file-read', 'file-write'],
  skillTags: ['email-marketing', 'copywriting', 'outreach', 'lead-generation', 'content-creation'],
  contactEmail: 'marketing-agent@cubiqo.ai',
  contactPhone: '+1-555-MARKETING',
};

console.log('Marketing Agent Configuration:');
console.log(JSON.stringify(agentConfig, null, 2));
console.log('\n✅ Agent configuration ready');

console.log('\n📝 To create this agent, use the following API call:');
console.log('\nPOST /api/agents');
console.log('Content-Type: application/json\n');
console.log(JSON.stringify(agentConfig, null, 2));

console.log('\n💡 Example prompts for the marketing agent:');
console.log('  1. "Draft an outreach email for enterprise customers"');
console.log('  2. "Create a LinkedIn post about our new AI features"');
console.log('  3. "Write a cold email for SaaS companies"');
console.log('  4. "Generate subject line variations for A/B testing"');
console.log('  5. "Draft a follow-up email for prospects who viewed our demo"');

console.log('\n⚠️  Remember: All drafts require explicit user confirmation before sending!\n');

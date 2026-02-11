#!/usr/bin/env node
/**
 * Verify Agent Setup
 * Checks that all components are in place for agent coordination
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'Environment file',
    test: () => fs.existsSync('.env.local'),
    fix: 'Create .env.local with EMERGENT_API_KEY'
  },
  {
    name: 'Emergent API key',
    test: () => {
      const env = fs.readFileSync('.env.local', 'utf-8');
      return env.includes('EMERGENT_API_KEY=sk-') || env.includes('ANTHROPIC_API_KEY');
    },
    fix: 'Add EMERGENT_API_KEY to .env.local'
  },
  {
    name: 'Henry SOUL.md',
    test: () => fs.existsSync('agents/henry/SOUL.md'),
    fix: 'Create agents/henry/SOUL.md'
  },
  {
    name: 'Dev SOUL.md',
    test: () => fs.existsSync('agents/dev/SOUL.md'),
    fix: 'Create agents/dev/SOUL.md'
  },
  {
    name: 'Writer SOUL.md',
    test: () => fs.existsSync('agents/writer/SOUL.md'),
    fix: 'Create agents/writer/SOUL.md'
  },
  {
    name: 'Tester SOUL.md',
    test: () => fs.existsSync('agents/tester/SOUL.md'),
    fix: 'Create agents/tester/SOUL.md'
  },
  {
    name: 'Bootstrap file',
    test: () => fs.existsSync('src/lib/engine/bootstrap.ts'),
    fix: 'Create bootstrap.ts'
  },
  {
    name: 'Tools registry',
    test: () => {
      const content = fs.readFileSync('src/lib/engine/tools.ts', 'utf-8');
      return content.includes('sessionsSpawnTool') && content.includes('sessionsSendTool');
    },
    fix: 'Add sessions_spawn and sessions_send to tools.ts'
  },
  {
    name: 'Agent implementation',
    test: () => {
      const content = fs.readFileSync('src/lib/engine/agent.ts', 'utf-8');
      return content.includes('async spawn(') && content.includes('async run(');
    },
    fix: 'Implement spawn() and run() methods in agent.ts'
  },
  {
    name: 'LLM router',
    test: () => fs.existsSync('src/lib/ai/llm-router.ts'),
    fix: 'Create llm-router.ts'
  },
  {
    name: 'Node modules',
    test: () => fs.existsSync('node_modules/@anthropic-ai/sdk'),
    fix: 'Run: npm install'
  },
  {
    name: 'Test scripts',
    test: () => fs.existsSync('test-spawn-simple.js'),
    fix: 'Test scripts missing'
  }
];

console.log('🔍 Verifying Agent Setup\n');

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    const result = check.test();
    if (result) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   Fix: ${check.fix}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✨ All checks passed! Ready to run tests.\n');
  console.log('Next steps:');
  console.log('  1. node test-spawn-simple.js');
  console.log('  2. node test-agent-coordination.js\n');
} else {
  console.log('\n⚠️  Some checks failed. Fix the issues above.\n');
  process.exit(1);
}

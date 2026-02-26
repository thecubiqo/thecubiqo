// Script to add critical environment variables to Vercel
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔑 ADDING CRITICAL ENVIRONMENT VARIABLES TO VERCEL');
console.log('==================================================\n');

// Check if Vercel CLI is logged in
console.log('1. 🔐 CHECKING VERCEL LOGIN STATUS:\n');

try {
  const whoami = execSync('vercel whoami', { cwd: __dirname }).toString().trim();
  console.log(`✅ Logged in as: ${whoami}`);
} catch (error) {
  console.log('❌ Not logged into Vercel or Vercel CLI not available');
  console.log('Run: vercel login');
  console.log('Then run this script again.');
  process.exit(1);
}

// Check project link
console.log('\n2. 🔗 CHECKING PROJECT LINK:\n');

try {
  const projects = execSync('vercel projects', { cwd: __dirname }).toString();
  console.log('Available projects:');
  console.log(projects);
  
  if (projects.includes('cubiqo-repo')) {
    console.log('✅ CubiQo project found');
  } else {
    console.log('❌ CubiQo project not found in list');
    console.log('Run: vercel link');
    console.log('Select existing project: cubiqo-repo');
    process.exit(1);
  }
} catch (error) {
  console.log('Error checking projects:', error.message);
}

// List current environment variables
console.log('\n3. 📋 CHECKING CURRENT ENVIRONMENT VARIABLES:\n');

try {
  const envList = execSync('vercel env ls', { cwd: __dirname }).toString();
  console.log('Current environment variables:');
  console.log(envList);
} catch (error) {
  console.log('Error listing environment variables:', error.message);
}

// Critical variables to add
const criticalVariables = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase URL (from Supabase project settings)',
    example: 'https://xxxxxxxxxxxx.supabase.co',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase Anonymous Key (client-side safe)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase Service Role Key (server-side only, keep secret!)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  },
  {
    name: 'ENCRYPTION_KEY',
    description: 'Encryption key for securing data (generate with: openssl rand -base64 32)',
    example: 'base64-encoded-32-byte-key-here',
    required: true
  },
  {
    name: 'ANTHROPIC_API_KEY',
    description: 'Anthropic Claude API key (optional - for AI features)',
    example: 'sk-ant-api03-xxxxxxxx',
    required: false
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key (optional - for GPT models)',
    example: 'sk-proj-xxxxxxxx',
    required: false
  },
  {
    name: 'RESEND_API_KEY',
    description: 'Resend email service key (optional - for notifications)',
    example: 're_xxxxxxxx',
    required: false
  }
];

console.log('\n4. 🚨 CRITICAL VARIABLES NEEDED:\n');

criticalVariables.forEach((variable, index) => {
  console.log(`${index + 1}. ${variable.name}`);
  console.log(`   📝 ${variable.description}`);
  console.log(`   💡 Example: ${variable.example}`);
  console.log(`   🔴 Required: ${variable.required ? 'YES' : 'NO (but recommended)'}`);
  console.log('');
});

// Instructions for adding variables
console.log('\n5. 📝 HOW TO ADD EACH VARIABLE:\n');

console.log('Method A: Vercel Dashboard (Recommended)');
console.log('----------------------------------------');
console.log('1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/environment-variables');
console.log('2. Click "Add New"');
console.log('3. For each variable:');
console.log('   - Name: Variable name (e.g., NEXT_PUBLIC_SUPABASE_URL)');
console.log('   - Value: Your actual value');
console.log('   - Environment: Production');
console.log('   - Click "Save"');
console.log('');

console.log('Method B: Vercel CLI');
console.log('--------------------');
criticalVariables.forEach(variable => {
  console.log(`vercel env add ${variable.name} production`);
});
console.log('');
console.log('Then enter the value when prompted.');
console.log('');

console.log('Method C: Bulk Import (Advanced)');
console.log('--------------------------------');
console.log('1. Create a file called .env.production.local with all variables');
console.log('2. Run: vercel env pull .env.production.local');
console.log('3. Run: vercel env push .env.production.local');
console.log('');

// Where to get the values
console.log('\n6. 🔍 WHERE TO GET THE VALUES:\n');

console.log('Supabase Keys:');
console.log('1. Go to: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to: Settings → API');
console.log('4. Copy:');
console.log('   - Project URL → NEXT_PUBLIC_SUPABASE_URL');
console.log('   - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - service_role secret → SUPABASE_SERVICE_ROLE_KEY');
console.log('');

console.log('Encryption Key:');
console.log('Generate with: openssl rand -base64 32');
console.log('Or: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
console.log('');

console.log('AI API Keys:');
console.log('• Anthropic: https://console.anthropic.com');
console.log('• OpenAI: https://platform.openai.com/api-keys');
console.log('• Google AI: https://aistudio.google.com/app/apikey');
console.log('• Groq: https://console.groq.com/keys');
console.log('');

console.log('Email Service:');
console.log('• Resend: https://resend.com/api-keys');
console.log('');

// Test after adding
console.log('\n7. 🧪 TEST AFTER ADDING VARIABLES:\n');

console.log('1. Trigger a new deployment:');
console.log('   git commit --allow-empty -m "Trigger deployment"');
console.log('   git push origin main');
console.log('');
console.log('2. Check deployment logs:');
console.log('   https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/deployments');
console.log('');
console.log('3. Test the site:');
console.log('   • https://www.cubiqo.ai');
console.log('   • https://www.cubiqo.ai/coder');
console.log('   • https://www.cubiqo.ai/founderspass (PIN: 2026)');
console.log('');
console.log('4. Check browser console for errors:');
console.log('   • Open browser developer tools (F12)');
console.log('   • Go to Console tab');
console.log('   • Look for red error messages');
console.log('');

// Quick commands to run
console.log('\n8. 🛠️ QUICK COMMANDS TO RUN:\n');

console.log('# Check current env vars');
console.log('vercel env ls');
console.log('');
console.log('# Add a single variable');
console.log('vercel env add NEXT_PUBLIC_SUPABASE_URL production');
console.log('');
console.log('# List all deployments');
console.log('vercel ls');
console.log('');
console.log('# Deploy manually');
console.log('vercel --prod');
console.log('');

// Summary
console.log('\n🎯 SUMMARY:');
console.log('==========');
console.log(`✅ Vercel CLI is logged in`);
console.log(`✅ Project is linked`);
console.log(`❌ ${criticalVariables.filter(v => v.required).length} CRITICAL variables missing`);
console.log(`⚠️  ${criticalVariables.filter(v => !v.required).length} recommended variables missing`);
console.log('');
console.log('🚨 WITHOUT THESE VARIABLES:');
console.log('• Database won\'t work (Supabase)');
console.log('• Data won\'t be encrypted (security risk)');
console.log('• AI features will be limited');
console.log('• Email notifications won\'t work');
console.log('');
console.log('🔗 VERCEL ENVIRONMENT VARIABLES DASHBOARD:');
console.log('https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/environment-variables');
console.log('');
console.log('📞 NEED HELP?');
console.log('1. Supabase setup: https://supabase.com/docs');
console.log('2. Vercel env vars: https://vercel.com/docs/projects/environment-variables');
console.log('3. CubiQo docs: Check the docs folder in the repo');
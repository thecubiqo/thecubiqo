// COMPLETE THIRD-PARTY CONFIGURATION FOR CUBIQO
const fs = require('fs');
const path = require('path');

console.log('🚀 COMPLETE THIRD-PARTY CONFIGURATION');
console.log('=====================================\n');

// 1. Read current environment
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  envContent = '';
}

// 2. Define ALL required third-party services
const thirdPartyServices = {
  // AI MODELS & APIs
  'ANTHROPIC_API_KEY': {
    description: 'Claude API Key from Anthropic',
    url: 'https://console.anthropic.com/',
    required: true,
    placeholder: 'sk-ant-api03-...'
  },
  'OPENAI_API_KEY': {
    description: 'OpenAI API Key (GPT models + DALL-E 3)',
    url: 'https://platform.openai.com/api-keys',
    required: true,
    placeholder: 'sk-proj-...'
  },
  'GROQ_API_KEY': {
    description: 'Groq API Key (fast Llama/Whisper inference)',
    url: 'https://console.groq.com/keys',
    required: false,
    placeholder: 'gsk_...'
  },
  'GOOGLE_AI_API_KEY': {
    description: 'Google AI API Key (Gemini models)',
    url: 'https://makersuite.google.com/app/apikey',
    required: false,
    placeholder: 'AIzaSy...'
  },
  'OPENROUTER_API_KEY': {
    description: 'OpenRouter API Key (unified model access)',
    url: 'https://openrouter.ai/keys',
    required: false,
    placeholder: 'sk-or-v1-...'
  },
  'MISTRAL_API_KEY': {
    description: 'Mistral API Key (Mixtral models)',
    url: 'https://console.mistral.ai/api-keys/',
    required: false,
    placeholder: '...'
  },
  'TOGETHER_API_KEY': {
    description: 'Together AI API Key (Llama models)',
    url: 'https://api.together.xyz/settings/api-keys',
    required: false,
    placeholder: '...'
  },

  // VOICE SYNTHESIS
  'ELEVENLABS_API_KEY': {
    description: 'ElevenLabs API Key (text-to-speech)',
    url: 'https://elevenlabs.io/app/settings/api-keys',
    required: true,
    placeholder: '...'
  },

  // EMAIL SERVICE
  'RESEND_API_KEY': {
    description: 'Resend API Key (transactional emails)',
    url: 'https://resend.com/api-keys',
    required: true,
    placeholder: 're_...'
  },

  // PAYMENT PROCESSING
  'STRIPE_SECRET_KEY': {
    description: 'Stripe Secret Key (payment processing)',
    url: 'https://dashboard.stripe.com/apikeys',
    required: true,
    placeholder: 'sk_live_...'
  },
  'STRIPE_WEBHOOK_SECRET': {
    description: 'Stripe Webhook Secret',
    url: 'https://dashboard.stripe.com/webhooks',
    required: true,
    placeholder: 'whsec_...'
  },

  // OAUTH INTEGRATIONS
  'GITHUB_CLIENT_ID': {
    description: 'GitHub OAuth Client ID',
    url: 'https://github.com/settings/developers',
    required: false,
    placeholder: 'Iv1.1234567890abcdef'
  },
  'GITHUB_CLIENT_SECRET': {
    description: 'GitHub OAuth Client Secret',
    url: 'https://github.com/settings/developers',
    required: false,
    placeholder: '...'
  },
  'VERCEL_CLIENT_ID': {
    description: 'Vercel OAuth Client ID',
    url: 'https://vercel.com/account/tokens',
    required: false,
    placeholder: '...'
  },
  'VERCEL_CLIENT_SECRET': {
    description: 'Vercel OAuth Client Secret',
    url: 'https://vercel.com/account/tokens',
    required: false,
    placeholder: '...'
  },

  // E-COMMERCE INTEGRATIONS
  'SHOPIFY_API_KEY': {
    description: 'Shopify API Key',
    url: 'https://[your-store].myshopify.com/admin/settings/apps/development',
    required: false,
    placeholder: '...'
  },
  'SHOPIFY_API_SECRET': {
    description: 'Shopify API Secret',
    url: 'https://[your-store].myshopify.com/admin/settings/apps/development',
    required: false,
    placeholder: '...'
  },
  'SHOPIFY_ACCESS_TOKEN': {
    description: 'Shopify Access Token',
    url: 'https://[your-store].myshopify.com/admin/settings/apps/development',
    required: false,
    placeholder: 'shpat_...'
  },
  'PRINTIFY_API_KEY': {
    description: 'Printify API Key',
    url: 'https://developers.printify.com/#getting-started',
    required: false,
    placeholder: '...'
  },

  // SOCIAL ARMY (GFXToolz + Platforms)
  'GFX_TOOLZ_USER': {
    description: 'GFXToolz Username',
    url: 'https://gfx.toolz/',
    required: true,
    placeholder: 'your_username'
  },
  'GFX_TOOLZ_PASS': {
    description: 'GFXToolz Password',
    url: 'https://gfx.toolz/',
    required: true,
    placeholder: 'your_password'
  },
  'TWITTER_API_KEY': {
    description: 'Twitter/X API Key',
    url: 'https://developer.twitter.com/en/portal/projects-and-apps',
    required: false,
    placeholder: '...'
  },
  'TWITTER_API_SECRET': {
    description: 'Twitter/X API Secret',
    url: 'https://developer.twitter.com/en/portal/projects-and-apps',
    required: false,
    placeholder: '...'
  },
  'TWITTER_ACCESS_TOKEN': {
    description: 'Twitter/X Access Token',
    url: 'https://developer.twitter.com/en/portal/projects-and-apps',
    required: false,
    placeholder: '...'
  },
  'TWITTER_ACCESS_SECRET': {
    description: 'Twitter/X Access Secret',
    url: 'https://developer.twitter.com/en/portal/projects-and-apps',
    required: false,
    placeholder: '...'
  },
  'LINKEDIN_CLIENT_ID': {
    description: 'LinkedIn Client ID',
    url: 'https://www.linkedin.com/developers/',
    required: false,
    placeholder: '...'
  },
  'LINKEDIN_CLIENT_SECRET': {
    description: 'LinkedIn Client Secret',
    url: 'https://www.linkedin.com/developers/',
    required: false,
    placeholder: '...'
  },
  'INSTAGRAM_APP_ID': {
    description: 'Instagram App ID (via Facebook)',
    url: 'https://developers.facebook.com/apps/',
    required: false,
    placeholder: '...'
  },
  'INSTAGRAM_APP_SECRET': {
    description: 'Instagram App Secret',
    url: 'https://developers.facebook.com/apps/',
    required: false,
    placeholder: '...'
  },

  // ENCRYPTION & SECURITY
  'ENCRYPTION_KEY': {
    description: 'Encryption Key for sensitive data',
    url: 'Generate with: openssl rand -base64 32',
    required: true,
    placeholder: 'base64_32_char_key_here'
  },
  'OAUTH_ENCRYPTION_KEY': {
    description: 'OAuth Token Encryption Key',
    url: 'Generate with: openssl rand -hex 32',
    required: false,
    placeholder: 'hex_64_char_key_here'
  },
  'CRON_SECRET': {
    description: 'Secret for cron job authentication',
    url: 'Generate secure random string',
    required: true,
    placeholder: 'secure_random_string_here'
  },

  // MONITORING & ANALYTICS
  'SENTRY_DSN': {
    description: 'Sentry DSN for error tracking',
    url: 'https://sentry.io/settings/projects/',
    required: false,
    placeholder: 'https://...@sentry.io/...'
  },
  'LOGTAIL_TOKEN': {
    description: 'Logtail token for logging',
    url: 'https://logtail.com/',
    required: false,
    placeholder: '...'
  },

  // MISCELLANEOUS
  'SELF_HEAL_SECRET': {
    description: 'Secret for self-heal reports',
    url: 'Generate with: openssl rand -hex 32',
    required: false,
    placeholder: '...'
  },
  'SELF_HEAL_EMAIL_FROM': {
    description: 'Email sender for reports',
    required: false,
    placeholder: 'noreply@cubiqo.ai'
  },
  'SELF_HEAL_EMAIL_TO': {
    description: 'Email recipient for reports',
    required: false,
    placeholder: 'aditya@cubiqo.ai'
  }
};

console.log('📊 CURRENT CONFIGURATION STATUS:\n');

let configuredCount = 0;
let totalCount = Object.keys(thirdPartyServices).length;

Object.entries(thirdPartyServices).forEach(([key, config]) => {
  const hasVar = envContent.includes(`${key}=`);
  const isConfigured = hasVar && !envContent.includes(`${key}=`) && 
                      !envContent.includes(`${key}=\n`) &&
                      !envContent.includes(`${key}=\r\n`);
  
  const status = isConfigured ? '✅ CONFIGURED' : 
                 hasVar ? '⚠️  PRESENT (check value)' : 
                 config.required ? '❌ REQUIRED' : '⚪ OPTIONAL';
  
  console.log(`${status} ${key}`);
  console.log(`   ${config.description}`);
  
  if (!isConfigured && !hasVar) {
    console.log(`   🔗 Get from: ${config.url}`);
    console.log(`   📝 Placeholder: ${config.placeholder}`);
  }
  
  console.log('');
  
  if (isConfigured) configuredCount++;
});

console.log(`📈 CONFIGURATION PROGRESS: ${configuredCount}/${totalCount} (${Math.round(configuredCount/totalCount*100)}%)`);

// 3. Create comprehensive configuration file
console.log('\n🔧 CREATING COMPLETE CONFIGURATION TEMPLATE:\n');

const configTemplate = Object.entries(thirdPartyServices).map(([key, config]) => {
  return `# ${config.description}
# Get from: ${config.url}
${key}=${config.placeholder}`;
}).join('\n\n');

const templatePath = path.join(__dirname, 'THIRD-PARTY-CONFIG-TEMPLATE.env');
fs.writeFileSync(templatePath, configTemplate);
console.log(`✅ Created configuration template: ${templatePath}`);

// 4. Update .env.local with missing variables
console.log('\n🔄 UPDATING .ENV.LOCAL WITH MISSING VARIABLES:\n');

let updatedEnv = envContent;
const missingVars = [];

Object.entries(thirdPartyServices).forEach(([key, config]) => {
  if (!envContent.includes(`${key}=`)) {
    missingVars.push(key);
    updatedEnv += `\n# ${config.description}\n# Get from: ${config.url}\n${key}=${config.placeholder}\n`;
  }
});

if (missingVars.length > 0) {
  fs.writeFileSync(envPath, updatedEnv);
  console.log(`✅ Added ${missingVars.length} missing variables to .env.local`);
  console.log('Added variables:');
  missingVars.forEach((varName, index) => {
    console.log(`  ${index + 1}. ${varName}`);
  });
} else {
  console.log('✅ All variables already present in .env.local');
}

// 5. Create setup instructions
console.log('\n📋 COMPLETE SETUP INSTRUCTIONS:\n');

console.log('🎯 PRIORITY 1: REQUIRED FOR PRODUCTION (Do these first):');
Object.entries(thirdPartyServices)
  .filter(([key, config]) => config.required && !envContent.includes(`${key}=`))
  .forEach(([key, config]) => {
    console.log(`\n🔴 ${key}:`);
    console.log(`   Purpose: ${config.description}`);
    console.log(`   Get from: ${config.url}`);
    console.log(`   Add to: Vercel Environment Variables`);
  });

console.log('\n🎯 PRIORITY 2: SOCIAL ARMY (For Railway deployment):');
const socialArmyVars = ['GFX_TOOLZ_USER', 'GFX_TOOLZ_PASS', 'TWITTER_API_KEY', 'TWITTER_API_SECRET'];
socialArmyVars.forEach(key => {
  const config = thirdPartyServices[key];
  if (config) {
    console.log(`\n🟡 ${key}:`);
    console.log(`   Purpose: ${config.description}`);
    console.log(`   Get from: ${config.url}`);
    console.log(`   Add to: Railway Environment Variables`);
  }
});

console.log('\n🎯 PRIORITY 3: OPTIONAL ENHANCEMENTS (Add later):');
Object.entries(thirdPartyServices)
  .filter(([key, config]) => !config.required && !envContent.includes(`${key}=`))
  .slice(0, 5)
  .forEach(([key, config]) => {
    console.log(`\n🟢 ${key}:`);
    console.log(`   Purpose: ${config.description}`);
    console.log(`   Get from: ${config.url}`);
  });

// 6. Create Vercel environment setup guide
console.log('\n🚀 VERCEL ENVIRONMENT VARIABLES SETUP:\n');

console.log('1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('2. Click "Settings" → "Environment Variables"');
console.log('3. Add these REQUIRED variables:');

Object.entries(thirdPartyServices)
  .filter(([_, config]) => config.required)
  .forEach(([key, config]) => {
    console.log(`   • ${key} = [your_${key.toLowerCase().replace(/_/g, '_')}]`);
  });

console.log('\n4. Click "Save"');
console.log('5. Redeploy the application');

// 7. Summary
console.log('\n📊 SUMMARY:\n');

console.log('✅ Created comprehensive third-party configuration template');
console.log('✅ Updated .env.local with all missing variables');
console.log('✅ Generated setup instructions for all services');
console.log(`✅ Total services to configure: ${totalCount}`);
console.log(`✅ Currently configured: ${configuredCount}`);
console.log(`✅ Remaining: ${totalCount - configuredCount}`);

console.log('\n🔧 NEXT ACTIONS FOR YOU:\n');

console.log('1. 🚨 REQUIRED IMMEDIATELY:');
console.log('   • Get Supabase keys (already have URL, need actual keys)');
console.log('   • Get OpenAI API key');
console.log('   • Get Anthropic API key');
console.log('   • Get ElevenLabs API key');
console.log('   • Get Resend API key');
console.log('   • Get Stripe keys');

console.log('\n2. 🚀 FOR SOCIAL ARMY (Railway):');
console.log('   • Get GFXToolz credentials');
console.log('   • Get Twitter/X API credentials');
console.log('   • Create Railway project and deploy');

console.log('\n3. 📈 FOR ENHANCED FUNCTIONALITY:');
console.log('   • Get GitHub OAuth credentials');
console.log('   • Get Shopify/Printify API keys');
console.log('   • Configure additional AI providers');

console.log('\n⏱️  ESTIMATED TIMELINE:');
console.log('   • Priority 1 (Required): 2-3 hours');
console.log('   • Priority 2 (Social Army): 1-2 hours');
console.log('   • Priority 3 (Enhancements): 1-2 days');
console.log('   • Total setup time: 4-8 hours');

console.log('\n🎯 ONCE COMPLETE:');
console.log('   • Production site will be fully functional');
console.log('   • Social Army will be operational on Railway');
console.log('   • All integrations will work');
console.log('   • CubiQo will be production-ready! 🚀');
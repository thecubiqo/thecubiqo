#!/usr/bin/env node

/**
 * Environment Validation Script
 * Checks that all required environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('═'.repeat(70), 'cyan');
  log(` ${message}`, 'cyan');
  log('═'.repeat(70), 'cyan');
  console.log('');
}

function checkEnvFile() {
  header('Environment File Check');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('✗ .env.local not found!', 'red');
    log('  Run: cp .env.example .env.local', 'yellow');
    return false;
  }
  
  log('✓ .env.local exists', 'green');
  
  if (!fs.existsSync(envExamplePath)) {
    log('✗ .env.example not found!', 'red');
    return false;
  }
  
  log('✓ .env.example exists', 'green');
  return true;
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

function validateSupabase(env) {
  header('Supabase Configuration');
  
  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase Project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase Anonymous Key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase Service Role Key',
  };
  
  let allValid = true;
  
  for (const [key, description] of Object.entries(required)) {
    if (!env[key] || env[key] === '' || env[key].includes('placeholder')) {
      log(`✗ ${description} (${key}) - NOT SET`, 'red');
      allValid = false;
    } else {
      // Basic format validation
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!env[key].startsWith('https://') || !env[key].includes('supabase.co')) {
          log(`✗ ${description} - INVALID FORMAT (should be https://xxx.supabase.co)`, 'red');
          allValid = false;
        } else {
          log(`✓ ${description} - OK`, 'green');
        }
      } else {
        // Check if key looks valid (not empty, not placeholder)
        log(`✓ ${description} - OK`, 'green');
      }
    }
  }
  
  return allValid;
}

function validateAIKeys(env) {
  header('AI API Keys (Optional)');
  
  const optional = {
    'ANTHROPIC_API_KEY': 'Anthropic/Claude API Key',
    'MINIMAX_API_KEY': 'MiniMax API Key',
    'MISTRAL_API_KEY': 'Mistral/Mixtral API Key',
    'TOGETHER_API_KEY': 'Together AI (Llama) API Key',
    'ELEVENLABS_API_KEY': 'ElevenLabs Voice API Key',
  };
  
  let hasAny = false;
  
  for (const [key, description] of Object.entries(optional)) {
    if (env[key] && env[key] !== '' && !env[key].includes('placeholder')) {
      log(`✓ ${description} - SET`, 'green');
      hasAny = true;
    } else {
      log(`○ ${description} - NOT SET (users will use BYO mode)`, 'yellow');
    }
  }
  
  if (!hasAny) {
    log('', 'reset');
    log('ℹ No AI keys configured - app will run in BYO mode', 'blue');
    log('  Users will need to provide their own API keys in the UI', 'blue');
  }
}

function validateDeployment(env) {
  header('Deployment Configuration');
  
  const nodeEnv = env.NODE_ENV || process.env.NODE_ENV || 'development';
  const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  log(`Node Environment: ${nodeEnv}`, 'cyan');
  log(`App URL: ${appUrl}`, 'cyan');
  
  if (nodeEnv === 'production' && appUrl.includes('localhost')) {
    log('⚠ Warning: Production mode but URL is localhost', 'yellow');
  }
}

function main() {
  log('', 'reset');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          CubiQo Environment Validation Tool                       ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Check if .env files exist
  if (!checkEnvFile()) {
    log('', 'reset');
    log('Please create .env.local before running validation', 'red');
    process.exit(1);
  }
  
  // Load environment variables
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    log('', 'reset');
    log('✗ Error reading .env.local: ' + error.message, 'red');
    process.exit(1);
  }
  
  // Run validations
  const supabaseValid = validateSupabase(env);
  validateAIKeys(env);
  validateDeployment(env);
  
  // Summary
  header('Summary');
  
  if (supabaseValid) {
    log('✓ All required configuration is valid!', 'green');
    log('', 'reset');
    log('You can now run: npm run dev', 'cyan');
  } else {
    log('✗ Configuration incomplete!', 'red');
    log('', 'reset');
    log('Please fix the issues above before starting the app.', 'yellow');
    log('', 'reset');
    log('Setup instructions:', 'cyan');
    log('1. Go to https://supabase.com and create a project', 'cyan');
    log('2. Get your API keys from Project Settings → API', 'cyan');
    log('3. Update .env.local with your credentials', 'cyan');
    log('4. Run database migrations: supabase db push', 'cyan');
    process.exit(1);
  }
  
  console.log('');
}

main();

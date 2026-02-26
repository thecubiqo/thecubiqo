// Social Army Railway Setup Script
const fs = require('fs');
const path = require('path');

console.log('🚀 SOCIAL ARMY RAILWAY SETUP');
console.log('============================\n');

// 1. Check current Social Army structure
console.log('1. 🔍 ANALYZING CURRENT SOCIAL ARMY STRUCTURE:\n');

const socialArmyPaths = [
  'src/components/social-army',
  'src/app/admin/social-army',
  'src/lib/social-army',
  'social-army'
];

socialArmyPaths.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  console.log(`   ${dir}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (exists) {
    try {
      const files = fs.readdirSync(path.join(__dirname, dir));
      console.log(`     Files: ${files.length > 0 ? files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : '') : 'None'}`);
    } catch (e) {
      // Not a directory or can't read
    }
  }
});

// 2. Check for Social Army code
console.log('\n2. 📦 CHECKING SOCIAL ARMY CODE:\n');

// Look for Social Army related files
const searchForFiles = (dir, pattern) => {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const results = [];
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        results.push(...searchForFiles(fullPath, pattern));
      } else if (file.name.toLowerCase().includes(pattern.toLowerCase())) {
        results.push(fullPath.replace(__dirname, ''));
      }
    }
    
    return results;
  } catch (e) {
    return [];
  }
};

const socialArmyFiles = searchForFiles(__dirname, 'social');
console.log(`   Found ${socialArmyFiles.length} Social Army related files:`);
socialArmyFiles.slice(0, 10).forEach(file => {
  console.log(`   • ${file}`);
});
if (socialArmyFiles.length > 10) {
  console.log(`   • ... and ${socialArmyFiles.length - 10} more`);
}

// 3. Check environment configuration
console.log('\n3. ⚙️ CURRENT ENVIRONMENT CONFIGURATION:\n');

const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.log('   ❌ .env.local not found, creating...');
  envContent = '';
}

// Check for Social Army variables
const socialArmyVars = [
  'SOCIAL_ARMY_STATUS',
  'GFX_TOOLZ_USER',
  'GFX_TOOLZ_PASS',
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_ID',
  'RAILWAY_TOKEN'
];

socialArmyVars.forEach(varName => {
  const hasVar = envContent.includes(varName);
  console.log(`   ${varName}: ${hasVar ? '✅ PRESENT' : '❌ MISSING'}`);
});

// 4. Create Railway configuration
console.log('\n4. 🚀 CREATING RAILWAY CONFIGURATION:\n');

// Create railway.json if it doesn't exist
const railwayConfig = {
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "startCommand": "npm start"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
};

const railwayConfigPath = path.join(__dirname, 'railway.json');
if (!fs.existsSync(railwayConfigPath)) {
  fs.writeFileSync(railwayConfigPath, JSON.stringify(railwayConfig, null, 2));
  console.log('   ✅ Created railway.json configuration');
} else {
  console.log('   ✅ railway.json already exists');
}

// 5. Update environment variables
console.log('\n5. 🔧 UPDATING ENVIRONMENT VARIABLES:\n');

// Add Social Army variables to .env.local
const newEnvVars = `
# ============================================================================
# SOCIAL ARMY - RAILWAY HOSTING
# ============================================================================
# Social Army daemon status: ON | OFF
SOCIAL_ARMY_STATUS=ON

# GFXToolz credentials for AI content generation
# Get from: https://gfx.toolz/
GFX_TOOLZ_USER=your_gfxtoolz_username
GFX_TOOLZ_PASS=your_gfxtoolz_password

# Railway Deployment Configuration
# Get these from Railway dashboard: https://railway.app/dashboard
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_SERVICE_ID=your_service_id
RAILWAY_TOKEN=your_railway_token

# Social Media Platform API Keys
# Twitter/X API v2
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# LinkedIn API
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token

# Instagram API (via Facebook)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Facebook Page API
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# TikTok API (Business Account required)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token

# Content Generation Settings
SOCIAL_ARMY_POST_FREQUENCY=4  # Posts per day
SOCIAL_ARMY_CONTENT_THEMES=tech,ai,startup,productivity
SOCIAL_ARMY_IMAGE_STYLE=modern,minimal,futuristic
SOCIAL_ARMY_HASHTAG_STRATEGY=trending,niche,branded

# Scheduling Configuration
SOCIAL_ARMY_TIMEZONE=America/New_York
SOCIAL_ARMY_PRIME_HOURS=9,12,15,18,21  # 9AM, 12PM, 3PM, 6PM, 9PM
SOCIAL_ARMY_WEEKDAYS_ONLY=true
SOCIAL_ARMY_MAX_POSTS_PER_DAY=6

# Analytics & Monitoring
SOCIAL_ARMY_ANALYTICS_ENABLED=true
SOCIAL_ARMY_ENGAGEMENT_THRESHOLD=10  # Minimum likes/comments
SOCIAL_ARMY_REPORT_FREQUENCY=daily
SOCIAL_ARMY_REPORT_EMAIL=aditya@cubiqo.ai

# Safety & Compliance
SOCIAL_ARMY_CONTENT_MODERATION=true
SOCIAL_ARMY_AUTO_DELETE_LOW_ENGAGEMENT=false
SOCIAL_ARMY_MINIMUM_QUALITY_SCORE=70
SOCIAL_ARMY_PLAGIARISM_CHECK=true
`;

// Check if we need to add these variables
const linesToAdd = newEnvVars.split('\n').filter(line => {
  const varName = line.split('=')[0].trim();
  return varName && !envContent.includes(`${varName}=`);
});

if (linesToAdd.length > 0) {
  // Append to .env.local
  const updatedEnv = envContent + '\n' + linesToAdd.join('\n');
  fs.writeFileSync(envPath, updatedEnv);
  console.log(`   ✅ Added ${linesToAdd.length} Social Army variables to .env.local`);
  console.log(`   ⚠️  NOTE: You need to replace placeholder values with actual credentials`);
} else {
  console.log('   ✅ Social Army variables already present in .env.local');
}

// 6. Create deployment instructions
console.log('\n6. 📋 RAILWAY DEPLOYMENT INSTRUCTIONS:\n');

console.log('STEP 1: Create Railway Project');
console.log('   • Go to: https://railway.app/new');
console.log('   • Click "Deploy from GitHub repo"');
console.log('   • Select: thecubiqo/thecubiqo');
console.log('   • Branch: main');

console.log('\nSTEP 2: Configure Environment Variables in Railway');
console.log('   • In Railway dashboard, go to your project');
console.log('   • Click "Variables" tab');
console.log('   • Add ALL Social Army variables from .env.local');
console.log('   • Replace placeholder values with real credentials');

console.log('\nSTEP 3: Get GFXToolz Credentials');
console.log('   • Sign up at: https://gfx.toolz/');
console.log('   • Get username/password from account');
console.log('   • Add to Railway variables: GFX_TOOLZ_USER, GFX_TOOLZ_PASS');

console.log('\nSTEP 4: Get Social Media API Keys');
console.log('   • Twitter/X: https://developer.twitter.com/');
console.log('   • LinkedIn: https://www.linkedin.com/developers/');
console.log('   • Instagram: https://developers.facebook.com/');
console.log('   • TikTok: https://developers.tiktok.com/');
console.log('   • YouTube: https://console.cloud.google.com/');

console.log('\nSTEP 5: Deploy to Railway');
console.log('   • Railway will auto-deploy from GitHub');
console.log('   • Monitor deployment in Railway dashboard');
console.log('   • Check logs for any errors');

console.log('\nSTEP 6: Test Social Army');
console.log('   • Access: https://cubiqo.ai/admin/social-army');
console.log('   • Turn on: SOCIAL_ARMY_STATUS=ON');
console.log('   • Test content generation');
console.log('   • Test posting to platforms');

// 7. Check if Social Army components need updates
console.log('\n7. 🔄 CHECKING FOR CODE UPDATES NEEDED:\n');

// Look for Social Army component that might need Railway integration
const potentialUpdates = [
  'Check if Social Army uses Railway-specific environment variables',
  'Verify API routes handle Railway deployment',
  'Check database connections for Railway PostgreSQL',
  'Verify file storage for Railway volumes',
  'Check cron jobs for Railway scheduler'
];

potentialUpdates.forEach((update, index) => {
  console.log(`   ${index + 1}. ${update}`);
});

console.log('\n🎯 SUMMARY:');
console.log('✅ Railway configuration files created');
console.log('✅ Environment variables template added');
console.log('✅ Deployment instructions prepared');
console.log('⚠️  Need actual API credentials from platforms');
console.log('⚠️  Need to create Railway project and deploy');
console.log('🚀 Social Army can be activated once deployed to Railway');

console.log('\n🔧 NEXT STEPS FOR YOU:');
console.log('1. Create Railway account/project');
console.log('2. Get GFXToolz credentials');
console.log('3. Get social media platform API keys');
console.log('4. Add real credentials to Railway variables');
console.log('5. Deploy to Railway');
console.log('6. Test Social Army functionality');

console.log('\n⏱️  ESTIMATED TIMELINE:');
console.log('   - Setup: 2-3 hours (getting API keys)');
console.log('   - Deployment: 30 minutes');
console.log('   - Testing: 1-2 hours');
console.log('   - Total: 4-6 hours');
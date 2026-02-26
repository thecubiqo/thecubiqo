// Check Vercel deployment status and build logs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CHECKING VERCEL DEPLOYMENT STATUS');
console.log('====================================\n');

// 1. Check if site loads content
console.log('1. 🌐 CHECKING SITE CONTENT LOAD:\n');

try {
  // Try to get actual page content
  const content = execSync('curl.exe -s https://www.cubiqo.ai | head -c 1000', { cwd: __dirname }).toString();
  
  if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
    console.log('✅ Site returns HTML content');
    
    // Check for common error patterns
    if (content.includes('404') || content.includes('Not Found')) {
      console.log('❌ Site shows 404 error');
    } else if (content.includes('Error') || content.includes('Failed')) {
      console.log('⚠️  Site shows error message');
    } else {
      console.log('✅ Site appears to be loading normally');
    }
    
    // Check for React hydration errors
    if (content.includes('hydration') || content.includes('Hydration')) {
      console.log('❌ React hydration error detected');
    }
    
    console.log('\nFirst 500 chars of response:');
    console.log(content.substring(0, 500));
    
  } else {
    console.log('❌ Site not returning proper HTML');
    console.log('Response:', content.substring(0, 200));
  }
} catch (error) {
  console.log('❌ Error checking site:', error.message);
}

// 2. Check build locally
console.log('\n2. 🔧 CHECKING LOCAL BUILD:\n');

try {
  // Check if we can build locally
  console.log('Checking Next.js build configuration...');
  
  // Check next.config.js
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('✅ next.config.js exists');
    
    // Check for problematic options
    if (nextConfig.includes('dir:')) {
      console.log('❌ Found "dir:" option - NOT SUPPORTED in Next.js 16!');
    }
    
    if (nextConfig.includes('appDir: true')) {
      console.log('✅ App Router enabled');
    }
  }
  
  // Check app directory structure
  const appDir = path.join(__dirname, 'app');
  const srcAppDir = path.join(__dirname, 'src', 'app');
  
  if (fs.existsSync(appDir)) {
    console.log('✅ App directory exists at root (app/)');
  } else if (fs.existsSync(srcAppDir)) {
    console.log('❌ App directory at src/app/ - should be at root app/ for Next.js 16');
  } else {
    console.log('❌ No app directory found!');
  }
  
  // Check for common missing dependencies
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = ['@supabase/supabase-js', '@fontsource/inter', 'three', '@react-three/fiber'];
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep} installed`);
    } else {
      console.log(`❌ ${dep} NOT installed`);
    }
  });
  
} catch (error) {
  console.log('❌ Error checking local build:', error.message);
}

// 3. Check environment variables
console.log('\n3. 🔑 CHECKING ENVIRONMENT VARIABLES:\n');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const line = envContent.split('\n').find(l => l.startsWith(`${varName}=`));
      const value = line ? line.split('=')[1] : '';
      
      if (value && !value.includes('placeholder') && !value.includes('your_')) {
        console.log(`✅ ${varName}: Configured`);
      } else {
        console.log(`⚠️  ${varName}: Placeholder value (needs real key)`);
      }
    } else {
      console.log(`❌ ${varName}: Missing`);
    }
  });
  
  // Check if we have real Supabase URL
  if (envContent.includes('https://naoxezcmcauecawchgjk.supabase.co')) {
    console.log('✅ Supabase URL configured');
  } else {
    console.log('❌ Supabase URL not configured');
  }
} else {
  console.log('❌ .env.local file not found');
}

// 4. Check for common build errors
console.log('\n4. 🚨 CHECKING FOR COMMON BUILD ERRORS:\n');

// Try to run a simple build check
try {
  // Check TypeScript compilation
  console.log('Checking TypeScript compilation...');
  const tsCheck = execSync('npx tsc --noEmit --skipLibCheck', { cwd: __dirname, stdio: 'pipe' }).toString();
  
  if (tsCheck.includes('error')) {
    console.log('❌ TypeScript errors found:');
    console.log(tsCheck.split('\n').filter(l => l.includes('error')).slice(0, 3).join('\n'));
  } else {
    console.log('✅ No TypeScript errors');
  }
} catch (error) {
  console.log('❌ TypeScript check failed:', error.message);
}

// 5. Check Vercel deployment URL
console.log('\n5. 🚀 CHECKING VERCEL DEPLOYMENT:\n');

console.log('Vercel Project: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('Production URL: https://www.cubiqo.ai');
console.log('Alternative URL: https://cubiqo.ai (redirects to www)');

console.log('\n🔍 MANUAL CHECKS NEEDED:');
console.log('1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('2. Click "Deployments" tab');
console.log('3. Check latest deployment status');
console.log('4. Look for build errors in logs');

console.log('\n🎯 QUICK TESTS:');
console.log('1. Open: https://www.cubiqo.ai');
console.log('2. Check browser console for errors (F12 → Console)');
console.log('3. Look for React hydration errors');
console.log('4. Test EnergyCube: Should have animations');
console.log('5. Test FoundersPass: https://www.cubiqo.ai/founderspass (PIN: 2026)');

console.log('\n🚨 MOST LIKELY ISSUES:');
console.log('1. ❌ Missing real Supabase keys in Vercel environment variables');
console.log('2. ❌ Build failing due to missing dependencies');
console.log('3. ❌ React hydration errors from component mismatches');
console.log('4. ❌ Vercel deployment stuck or failed');

console.log('\n🔧 IMMEDIATE FIXES:');
console.log('1. Check Vercel deployment logs for specific errors');
console.log('2. Add real Supabase keys to Vercel environment variables');
console.log('3. Redeploy if build failed');
console.log('4. Check browser console for client-side errors');

console.log('\n📞 SUPPORT:');
console.log('• Vercel Status: https://vercel-status.com/');
console.log('• Next.js Docs: https://nextjs.org/docs');
console.log('• Supabase Dashboard: https://app.supabase.com/project/naoxezcmcauecawchgjk');
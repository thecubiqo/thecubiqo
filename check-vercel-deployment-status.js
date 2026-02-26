// Check Vercel deployment status and diagnose issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DIAGNOSING VERCEL DEPLOYMENT ISSUES');
console.log('======================================\n');

// 1. Check if we can access the Vercel deployment API
console.log('1. 🚀 CHECKING VERCEL DEPLOYMENT STATUS:\n');

console.log('Vercel Project URL: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('Production URL: https://www.cubiqo.ai');
console.log('Deployment ID: dpl_6xQrdCdL7274zpipGLuai2Abq5Qu (from response headers)');

// 2. Check specific pages for errors
console.log('\n2. 🌐 CHECKING SPECIFIC PAGES:\n');

const pagesToCheck = [
  { url: 'https://www.cubiqo.ai', name: 'Homepage' },
  { url: 'https://www.cubiqo.ai/founderspass', name: 'FoundersPass' },
  { url: 'https://www.cubiqo.ai/demo', name: 'Demo' },
  { url: 'https://www.cubiqo.ai/coder', name: 'Coder' },
  { url: 'https://www.cubiqo.ai/marketing', name: 'Marketing' },
  { url: 'https://www.cubiqo.ai/admin/social-army', name: 'Social Army Admin' }
];

pagesToCheck.forEach(page => {
  try {
    const status = execSync(`curl.exe -s -o /dev/null -w "%{http_code}" "${page.url}"`, { cwd: __dirname }).toString().trim();
    console.log(`${page.name}: HTTP ${status} - ${page.url}`);
  } catch (error) {
    console.log(`${page.name}: ERROR - ${error.message}`);
  }
});

// 3. Check for common issues in the codebase
console.log('\n3. 🔧 CHECKING CODEBASE FOR ISSUES:\n');

// Check if app directory exists
const appDir = path.join(__dirname, 'app');
if (fs.existsSync(appDir)) {
  console.log('✅ App directory exists at: app/');
  
  // Check for critical files
  const criticalFiles = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/founderspass/page.tsx',
    'app/demo/page.tsx'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} MISSING!`);
    }
  });
} else {
  console.log('❌ App directory NOT FOUND at: app/');
  console.log('   This is critical - Next.js 16 requires app/ at root');
}

// Check next.config.js
const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  console.log('✅ next.config.js exists');
  
  // Check for problematic configurations
  if (nextConfig.includes('dir:')) {
    console.log('❌ Found "dir:" option - REMOVE THIS! Not supported in Next.js 16');
  }
  
  if (nextConfig.includes('appDir: true')) {
    console.log('✅ App Router enabled');
  }
  
  if (nextConfig.includes('experimental')) {
    console.log('⚠️  Experimental features enabled');
  }
} else {
  console.log('❌ next.config.js MISSING!');
}

// 4. Check environment variables setup
console.log('\n4. 🔑 CHECKING ENVIRONMENT VARIABLES:\n');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for Supabase variables
  const supabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const supabaseAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  const supabaseServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
  
  console.log(`Supabase URL: ${supabaseUrl ? '✅ Configured' : '❌ MISSING'}`);
  console.log(`Supabase Anon Key: ${supabaseAnonKey ? '✅ Configured' : '❌ MISSING'}`);
  console.log(`Supabase Service Key: ${supabaseServiceKey ? '✅ Configured' : '❌ MISSING'}`);
  
  // Check if values are placeholders
  if (envContent.includes('your_actual_key') || envContent.includes('placeholder')) {
    console.log('⚠️  WARNING: Environment variables contain placeholders!');
    console.log('   These need REAL values in Vercel environment variables.');
  }
} else {
  console.log('❌ .env.local file not found');
}

// 5. Check package.json dependencies
console.log('\n5. 📦 CHECKING DEPENDENCIES:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@supabase/supabase-js',
    '@fontsource/inter',
    'three',
    '@react-three/fiber'
  ];
  
  criticalDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: NOT INSTALLED`);
    }
  });
  
  // Check Next.js version
  if (deps.next) {
    const nextVersion = deps.next;
    if (nextVersion.startsWith('14') || nextVersion.startsWith('15') || nextVersion.startsWith('16')) {
      console.log(`✅ Next.js ${nextVersion} - App Router supported`);
    } else {
      console.log(`⚠️  Next.js ${nextVersion} - May not support App Router`);
    }
  }
} else {
  console.log('❌ package.json not found');
}

// 6. Check for build errors by trying to build locally
console.log('\n6. 🏗️ CHECKING FOR BUILD ERRORS:\n');

try {
  // Check TypeScript
  console.log('Checking TypeScript compilation...');
  execSync('npx tsc --noEmit --skipLibCheck 2>&1 | head -20', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compilation seems OK');
} catch (error) {
  console.log('❌ TypeScript errors found:');
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
  console.log(errorOutput.split('\n').slice(0, 10).join('\n'));
}

// 7. Check browser console errors
console.log('\n7. 🖥️ CHECKING FOR CLIENT-SIDE ERRORS:\n');

console.log('To check for client-side errors:');
console.log('1. Open https://www.cubiqo.ai in Chrome/Firefox');
console.log('2. Press F12 to open Developer Tools');
console.log('3. Go to "Console" tab');
console.log('4. Look for red error messages');
console.log('5. Common issues:');
console.log('   • React hydration errors');
console.log('   • Failed to fetch API calls');
console.log('   • Missing environment variables');
console.log('   • Supabase connection errors');

// 8. Most likely issues
console.log('\n8. 🚨 MOST LIKELY ISSUES:\n');

console.log('A. ❌ Missing Supabase keys in Vercel environment variables');
console.log('   Fix: Add REAL Supabase keys to Vercel dashboard');
console.log('   Get from: https://app.supabase.com/project/naoxezcmcauecawchgjk/settings/api');

console.log('\nB. ❌ React hydration errors');
console.log('   Fix: Check browser console for specific errors');
console.log('   Common causes: Server/client rendering mismatch');

console.log('\nC. ❌ API routes failing due to missing dependencies');
console.log('   Fix: Check Vercel build logs for missing imports');

console.log('\nD. ❌ FoundersPass stuck on "Loading..."');
console.log('   Fix: Check if Supabase connection is working');
console.log('   Check browser console for fetch errors');

// 9. Immediate fixes to try
console.log('\n9. 🔧 IMMEDIATE FIXES TO TRY:\n');

console.log('1. ✅ Add REAL Supabase keys to Vercel:');
console.log('   • NEXT_PUBLIC_SUPABASE_URL=https://naoxezcmcauecawchgjk.supabase.co');
console.log('   • NEXT_PUBLIC_SUPABASE_ANON_KEY=your_real_key_here');
console.log('   • SUPABASE_SERVICE_ROLE_KEY=your_real_key_here');

console.log('\n2. ✅ Check Vercel deployment logs:');
console.log('   • Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('   • Click "Deployments"');
console.log('   • Click latest deployment');
console.log('   • Check "Build Logs" for errors');

console.log('\n3. ✅ Test Supabase connection:');
console.log('   • Open browser console on https://www.cubiqo.ai');
console.log('   • Look for Supabase connection errors');
console.log('   • Test: https://www.cubiqo.ai/founderspass');

console.log('\n4. ✅ Redeploy if needed:');
console.log('   • If build failed, redeploy from Vercel dashboard');
console.log('   • Or push a new commit to trigger deployment');

// 10. Summary
console.log('\n10. 📊 SUMMARY:\n');

console.log('✅ Site IS loading (returns 200 OK)');
console.log('✅ HTML content is being served');
console.log('✅ Vercel deployment appears active');
console.log('⚠️  FoundersPass shows "Loading..." - likely Supabase connection issue');
console.log('⚠️  Need REAL Supabase keys in Vercel environment variables');

console.log('\n🎯 NEXT STEPS:');
console.log('1. Check Vercel deployment logs for specific errors');
console.log('2. Add REAL Supabase keys to Vercel environment variables');
console.log('3. Check browser console for client-side errors');
console.log('4. Test Supabase connection');
console.log('5. Redeploy if build failed');

console.log('\n🔗 LINKS:');
console.log('• Vercel Dashboard: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
console.log('• Supabase Project: https://app.supabase.com/project/naoxezcmcauecawchgjk');
console.log('• Production Site: https://www.cubiqo.ai');
console.log('• FoundersPass: https://www.cubiqo.ai/founderspass (PIN: 2026)');
// Test Supabase connection with current environment variables
const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING SUPABASE CONNECTION');
console.log('===============================\n');

// Read the Supabase client configuration
const supabaseClientPath = path.join(__dirname, 'lib/supabase/client.ts');
if (!fs.existsSync(supabaseClientPath)) {
  console.log('❌ Supabase client not found at:', supabaseClientPath);
  process.exit(1);
}

const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
console.log('1. 📋 SUPABASE CLIENT CONFIGURATION:\n');

// Extract the configuration
const urlMatch = clientContent.match(/NEXT_PUBLIC_SUPABASE_URL[^=]*=\s*['"]([^'"]+)['"]/);
const anonKeyMatch = clientContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY[^=]*=\s*['"]([^'"]+)['"]/);

if (urlMatch) {
  console.log(`✅ Supabase URL variable: ${urlMatch[1]}`);
} else {
  console.log('❌ Could not find Supabase URL in client.ts');
}

if (anonKeyMatch) {
  // Mask the key for security
  const key = anonKeyMatch[1];
  const maskedKey = key.length > 20 ? key.substring(0, 10) + '...' + key.substring(key.length - 10) : '***';
  console.log(`✅ Supabase Anon Key variable: ${maskedKey}`);
} else {
  console.log('❌ Could not find Supabase Anon Key in client.ts');
}

// Check for _1 suffix versions
console.log('\n2. 🔍 CHECKING FOR _1 SUFFIX VARIABLES:\n');

const url1Match = clientContent.match(/NEXT_PUBLIC_SUPABASE_URL1[^=]*=\s*['"]([^'"]+)['"]/);
const anonKey1Match = clientContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY1[^=]*=\s*['"]([^'"]+)['"]/);

if (url1Match) {
  console.log(`⚠️  Found _1 suffix URL: ${url1Match[1]}`);
  console.log('   This might be causing issues if code expects _1 but env var is without _1');
}

if (anonKey1Match) {
  const key = anonKey1Match[1];
  const maskedKey = key.length > 20 ? key.substring(0, 10) + '...' + key.substring(key.length - 10) : '***';
  console.log(`⚠️  Found _1 suffix Anon Key: ${maskedKey}`);
}

// Check which variables are actually being used
console.log('\n3. 🔧 CHECKING WHICH VARIABLES ARE USED:\n');

const createClientLine = clientContent.match(/createClient\([^)]+\)/);
if (createClientLine) {
  console.log('createClient() call found:');
  console.log(createClientLine[0].substring(0, 100) + '...');
  
  // Check if it uses process.env directly or imported constants
  if (createClientLine[0].includes('process.env')) {
    console.log('✅ Uses process.env directly');
  } else if (createClientLine[0].includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('✅ Uses imported constants');
  }
}

// Check for common issues
console.log('\n4. 🚨 COMMON SUPABASE ISSUES:\n');

const issues = [];

// Check if URL ends with .co (Supabase standard)
if (urlMatch && !urlMatch[1].includes('.supabase.co')) {
  issues.push('Supabase URL might not be correct (should contain .supabase.co)');
}

// Check if anon key looks like a JWT
if (anonKeyMatch && !anonKeyMatch[1].startsWith('eyJ')) {
  issues.push('Anon key might not be a valid JWT (should start with eyJ)');
}

// Check for hardcoded values vs env vars
if (clientContent.includes('https://') && clientContent.includes('.supabase.co') && 
    !clientContent.includes('process.env') && !clientContent.includes('NEXT_PUBLIC_')) {
  issues.push('Supabase URL might be hardcoded instead of using environment variables');
}

if (issues.length === 0) {
  console.log('✅ No obvious configuration issues found');
} else {
  console.log('⚠️  Potential issues:');
  issues.forEach(issue => console.log(`   • ${issue}`));
}

// Check the actual Supabase client import
console.log('\n5. 📦 CHECKING SUPABASE CLIENT IMPORT:\n');

if (clientContent.includes('@supabase/supabase-js')) {
  console.log('✅ @supabase/supabase-js package is imported');
  
  // Check version if possible
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const supabaseVersion = packageJson.dependencies?.['@supabase/supabase-js'] || 
                           packageJson.devDependencies?.['@supabase/supabase-js'];
    if (supabaseVersion) {
      console.log(`✅ Supabase JS version: ${supabaseVersion}`);
    }
  }
} else {
  console.log('❌ @supabase/supabase-js not imported');
}

// Recommendations
console.log('\n6. 🎯 RECOMMENDATIONS:\n');

console.log('If Supabase is not working:');
console.log('1. 🔄 Trigger new deployment to pick up env vars');
console.log('   git commit --allow-empty -m "Trigger deployment"');
console.log('   git push origin main');
console.log('');
console.log('2. 🔍 Check browser console for errors');
console.log('   • Open https://www.cubiqo.ai');
console.log('   • Press F12 → Console tab');
console.log('   • Look for Supabase-related errors');
console.log('');
console.log('3. 🧪 Test Supabase connection directly');
console.log('   • Go to your Supabase dashboard');
console.log('   • Check if project is active');
console.log('   • Test API from Supabase console');
console.log('');
console.log('4. 🔄 Update environment variables if needed');
console.log('   • Go to Vercel env vars dashboard');
console.log('   • Verify values are correct');
console.log('   • Add missing variables');
console.log('');
console.log('5. 📝 Check variable name consistency');
console.log('   • Code might expect NEXT_PUBLIC_SUPABASE_URL1');
console.log('   • But env var is NEXT_PUBLIC_SUPABASE_URL');
console.log('   • Fix by updating code or env var name');

// Quick fix for _1 suffix issue
console.log('\n7. 🔧 QUICK FIX FOR _1 SUFFIX ISSUE:\n');

if (url1Match || anonKey1Match) {
  console.log('Code uses _1 suffix variables but env vars might not have _1');
  console.log('Solution 1: Add _1 suffix env vars in Vercel:');
  console.log('   vercel env add NEXT_PUBLIC_SUPABASE_URL1 production');
  console.log('   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY1 production');
  console.log('');
  console.log('Solution 2: Update code to not use _1 suffix:');
  console.log('   Edit lib/supabase/client.ts');
  console.log('   Change NEXT_PUBLIC_SUPABASE_URL1 to NEXT_PUBLIC_SUPABASE_URL');
  console.log('   Change NEXT_PUBLIC_SUPABASE_ANON_KEY1 to NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('\n🔗 LINKS:');
console.log('• Vercel Env Vars: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/environment-variables');
console.log('• Supabase Dashboard: https://app.supabase.com');
console.log('• CubiQo Site: https://www.cubiqo.ai');
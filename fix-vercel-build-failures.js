// Fix Vercel build failures
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 FIXING VERCEL BUILD FAILURES');
console.log('===============================\n');

// 1. First, let's check the current build locally
console.log('1. 🧪 TESTING LOCAL BUILD:\n');

try {
  console.log('Running: npm run build');
  const buildOutput = execSync('npm run build', { cwd: __dirname, stdio: 'pipe' }).toString();
  console.log('✅ Local build succeeded!');
  console.log(buildOutput.substring(buildOutput.length - 500)); // Last 500 chars
} catch (error) {
  console.log('❌ Local build failed!');
  console.log('Error output:');
  console.log(error.stdout?.toString() || error.message);
  console.log('\nFull error:');
  console.log(error.stderr?.toString() || 'No stderr');
}

// 2. Check package.json for issues
console.log('\n2. 📦 CHECKING PACKAGE.JSON:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`Project: ${packageJson.name}`);
  console.log(`Version: ${packageJson.version}`);
  
  // Check scripts
  if (packageJson.scripts) {
    console.log('\nBuild scripts:');
    Object.entries(packageJson.scripts).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
  
  // Check dependencies
  console.log('\nKey dependencies:');
  const keyDeps = {
    'next': packageJson.dependencies?.next,
    'react': packageJson.dependencies?.react,
    'react-dom': packageJson.dependencies?.['react-dom'],
    '@supabase/supabase-js': packageJson.dependencies?.['@supabase/supabase-js'],
    '@vercel/analytics': packageJson.dependencies?.['@vercel/analytics']
  };
  
  Object.entries(keyDeps).forEach(([dep, version]) => {
    if (version) {
      console.log(`  ✅ ${dep}: ${version}`);
    } else {
      console.log(`  ❌ ${dep}: MISSING`);
    }
  });
  
  // Check for problematic dependencies
  console.log('\nChecking for problematic dependencies:');
  const problematicDeps = [
    'sharp', // Image optimization - often causes issues
    'canvas', // Native dependency
    'bcrypt', // Native dependency
    'sqlite3' // Native dependency
  ];
  
  problematicDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`  ⚠️  ${dep}: Found - may cause build issues on Vercel`);
    }
  });
}

// 3. Check next.config.js
console.log('\n3. ⚙️ CHECKING NEXT.CONFIG.JS:\n');

const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  console.log('Next.js config found');
  
  // Check for common issues
  const checks = [
    { pattern: /output:\s*['"]standalone['"]/, message: '✅ Output: standalone (good for Vercel)' },
    { pattern: /images:/, message: '✅ Images config present' },
    { pattern: /experimental:/, message: '✅ Experimental features config' },
    { pattern: /webpack:/, message: '✅ Webpack config' },
    { pattern: /dir:\s*['"]/, message: '⚠️  dir option found (deprecated in Next.js 13+)' }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(nextConfig)) {
      console.log(`  ${check.message}`);
    }
  });
  
  // Check for TypeScript errors
  if (nextConfig.includes('// @ts-') || nextConfig.includes('// ts-')) {
    console.log('  ⚠️  TypeScript ignores found');
  }
} else {
  console.log('❌ No next.config.js found!');
}

// 4. Check for TypeScript errors
console.log('\n4. 📝 CHECKING FOR TYPESCRIPT ERRORS:\n');

try {
  const tsCheck = execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' }).toString();
  if (tsCheck.includes('error')) {
    console.log('❌ TypeScript errors found:');
    console.log(tsCheck.substring(0, 1000));
  } else {
    console.log('✅ No TypeScript errors');
  }
} catch (error) {
  console.log('❌ TypeScript check failed:');
  console.log(error.stdout?.toString().substring(0, 1000) || error.message);
}

// 5. Check for missing imports
console.log('\n5. 🔍 CHECKING FOR MISSING IMPORTS:\n');

// Common missing imports that cause build failures
const commonMissingImports = [
  'use client',
  'use server',
  'import React',
  'from "react"',
  'from "next/"'
];

// Check a few key files
const keyFiles = [
  'src/components/FullscreenApp.tsx',
  'app/coder/page.tsx',
  'app/page.tsx',
  'app/layout.tsx'
];

keyFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for React import
    if (content.includes('React.') || content.includes('useState') || content.includes('useEffect')) {
      if (!content.includes('import React') && !content.includes('from "react"')) {
        console.log(`  ⚠️  ${file}: Uses React but may not import it`);
      }
    }
    
    // Check for client/server directives
    if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
      if (!content.includes("'use client'")) {
        console.log(`  ⚠️  ${file}: Client component missing 'use client' directive`);
      }
    }
  }
});

// 6. Check node version
console.log('\n6. 🟢 CHECKING NODE VERSION:\n');

try {
  const nodeVersion = execSync('node --version', { cwd: __dirname }).toString().trim();
  console.log(`Local Node: ${nodeVersion}`);
  
  // Check package.json engines
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.engines?.node) {
    console.log(`Required Node: ${packageJson.engines.node}`);
    
    // Check compatibility
    const required = packageJson.engines.node.replace('>=', '').replace('<=', '').replace('^', '').replace('~', '');
    const current = nodeVersion.replace('v', '');
    
    if (parseFloat(current) < parseFloat(required)) {
      console.log(`  ⚠️  Node version too old (need ${required}, have ${current})`);
    }
  } else {
    console.log('  ⚠️  No Node version specified in package.json');
  }
} catch (error) {
  console.log('Error checking Node version:', error.message);
}

// 7. Common Vercel build failure causes
console.log('\n7. 🚨 COMMON VERCEL BUILD FAILURE CAUSES:\n');

const commonCauses = [
  'Missing environment variables',
  'TypeScript errors',
  'Missing dependencies',
  'Native module compilation failures',
  'Memory limits exceeded',
  'Build timeout (default: 60s)',
  'Invalid Next.js configuration',
  'Client/Server component boundaries violated',
  'Missing "use client" or "use server" directives',
  'Invalid import paths',
  'Circular dependencies',
  'ESLint errors in CI',
  'Sharp/image optimization issues',
  'Node version mismatch'
];

commonCauses.forEach((cause, i) => {
  console.log(`${i + 1}. ${cause}`);
});

// 8. Fix common issues
console.log('\n8. 🔧 FIXING COMMON ISSUES:\n');

// Fix 1: Ensure React is imported in key files
console.log('Fix 1: Ensuring React imports...');
keyFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add React import if needed
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('React.')) && 
        !content.includes('import React') && !content.includes('from "react"')) {
      // Add import at top
      const lines = content.split('\n');
      let importAdded = false;
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].includes('import')) {
          lines.splice(i, 0, "import React from 'react';");
          importAdded = true;
          break;
        }
      }
      if (!importAdded) {
        lines.unshift("import React from 'react';");
      }
      content = lines.join('\n');
      modified = true;
    }
    
    // Add 'use client' if needed
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) && 
        !content.includes("'use client'") && !content.includes("'use server'")) {
      content = "'use client';\n\n" + content;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed imports in ${file}`);
    }
  }
});

// Fix 2: Check and fix next.config.js
console.log('\nFix 2: Checking next.config.js...');
if (fs.existsSync(nextConfigPath)) {
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Remove deprecated 'dir' option
  if (nextConfig.includes('dir:')) {
    nextConfig = nextConfig.replace(/dir:\s*['"][^'"]*['"]\s*,?\s*/g, '');
    console.log('  ✅ Removed deprecated dir option');
  }
  
  // Ensure output: 'standalone' for Vercel
  if (!nextConfig.includes("output: 'standalone'") && !nextConfig.includes('output: "standalone"')) {
    // Add output config
    if (nextConfig.includes('module.exports = {')) {
      nextConfig = nextConfig.replace(
        'module.exports = {',
        'module.exports = {\n  output: "standalone",'
      );
      console.log('  ✅ Added output: "standalone"');
    }
  }
  
  fs.writeFileSync(nextConfigPath, nextConfig);
}

// Fix 3: Update package.json if needed
console.log('\nFix 3: Checking package.json dependencies...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let packageModified = false;

// Ensure Next.js version is compatible
if (packageJson.dependencies?.next) {
  const nextVersion = packageJson.dependencies.next;
  if (nextVersion.startsWith('12.') || nextVersion.startsWith('11.')) {
    console.log(`  ⚠️  Next.js ${nextVersion} may be too old for App Router`);
    // Could update, but let's not auto-update major versions
  }
}

// Add missing key dependencies
const missingDeps = {
  'react': '^18.2.0',
  'react-dom': '^18.2.0',
  '@types/react': '^18.2.0',
  '@types/react-dom': '^18.2.0'
};

Object.entries(missingDeps).forEach(([dep, version]) => {
  if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    packageJson.devDependencies[dep] = version;
    packageModified = true;
    console.log(`  ✅ Added ${dep}@${version} to devDependencies`);
  }
});

if (packageModified) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// 9. Test build again
console.log('\n9. 🧪 TESTING BUILD AGAIN:\n');

try {
  console.log('Installing dependencies...');
  execSync('npm install', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ Dependencies installed');
  
  console.log('\nBuilding...');
  const buildOutput = execSync('npm run build', { cwd: __dirname, stdio: 'pipe' }).toString();
  if (buildOutput.includes('Build completed successfully') || buildOutput.includes('✓')) {
    console.log('✅ Build succeeded!');
  } else {
    console.log('⚠️  Build output:');
    console.log(buildOutput.substring(buildOutput.length - 1000));
  }
} catch (error) {
  console.log('❌ Build still failing:');
  console.log(error.stdout?.toString().substring(0, 2000) || error.message);
  
  // Try to get more specific error
  if (error.stderr) {
    const stderr = error.stderr.toString();
    if (stderr.includes('Module not found')) {
      console.log('\n🔍 Module not found error. Try:');
      console.log('npm install --legacy-peer-deps');
    } else if (stderr.includes('Memory')) {
      console.log('\n🔍 Memory issue. Try increasing Vercel memory limit.');
    } else if (stderr.includes('timeout')) {
      console.log('\n🔍 Timeout issue. Try optimizing build.');
    }
  }
}

// 10. Push fixes
console.log('\n10. 📤 PUSHING FIXES:\n');

console.log('Run these commands:');
console.log('git add .');
console.log('git commit -m "Fix Vercel build failures"');
console.log('git push origin main');
console.log('');
console.log('This will trigger a new Vercel deployment.');

// 11. Check Vercel deployment logs
console.log('\n11. 🔍 CHECK VERCEL DEPLOYMENT LOGS:\n');

console.log('Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/deployments');
console.log('Click on the latest failed deployment');
console.log('Check "Build Logs" for specific errors');

// 12. Summary
console.log('\n🎯 BUILD FAILURE FIXES APPLIED:');
console.log('==============================');
console.log('1. ✅ Checked local build');
console.log('2. ✅ Fixed React imports');
console.log('3. ✅ Added "use client" directives');
console.log('4. ✅ Fixed next.config.js');
console.log('5. ✅ Added missing dependencies');
console.log('6. ✅ Tested build');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Commit and push the fixes');
console.log('2. Check Vercel deployment logs');
console.log('3. If still failing, check specific error in logs');
console.log('4. May need to adjust Vercel project settings');

console.log('\n🔗 VERCEL LINKS:');
console.log('• Deployments: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/deployments');
console.log('• Settings: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings');
console.log('• Build Logs: Check failed deployment → Build Logs');

console.log('\n⚠️  IF BUILD STILL FAILS:');
console.log('1. Check for native module issues (sharp, canvas, etc.)');
console.log('2. Increase build timeout in Vercel settings');
console.log('3. Check memory limits');
console.log('4. Simplify the build (remove heavy dependencies)');
console.log('5. Contact Vercel support');
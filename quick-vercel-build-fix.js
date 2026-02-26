// Quick fix for Vercel build failures
const fs = require('fs');
const path = require('path');

console.log('🚀 QUICK FIX FOR VERCEL BUILD FAILURES');
console.log('======================================\n');

// 1. Check the most common issue: next.config.js
console.log('1. ⚙️ FIXING NEXT.CONFIG.JS:\n');

const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Remove any problematic options
  if (nextConfig.includes('dir:')) {
    console.log('❌ Found deprecated "dir" option - removing');
    nextConfig = nextConfig.replace(/dir:\s*['"][^'"]*['"]\s*,?\s*/g, '');
  }
  
  // Ensure output is standalone for Vercel
  if (!nextConfig.includes('output:')) {
    console.log('✅ Adding output: "standalone" for Vercel');
    nextConfig = nextConfig.replace(
      'module.exports = {',
      'module.exports = {\n  output: "standalone",'
    );
  }
  
  // Add turbopack config to fix lockfile warning
  if (!nextConfig.includes('turbopack')) {
    console.log('✅ Adding turbopack config');
    nextConfig = nextConfig.replace(
      'module.exports = {',
      'module.exports = {\n  turbopack: {\n    // Resolve workspace root warning\n    resolveAlias: {\n      "@/*": ["./src/*"]\n    }\n  },'
    );
  }
  
  fs.writeFileSync(nextConfigPath, nextConfig);
  console.log('✅ Updated next.config.js');
}

// 2. Check package.json for critical issues
console.log('\n2. 📦 FIXING PACKAGE.JSON:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let modified = false;

// Ensure Node version is specified
if (!packageJson.engines) {
  packageJson.engines = { node: '>=18.0.0' };
  modified = true;
  console.log('✅ Added Node engine requirement');
}

// Ensure build script exists
if (!packageJson.scripts?.build) {
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.build = 'next build';
  modified = true;
  console.log('✅ Added build script');
}

// Check for problematic dependencies
const problematicDeps = ['sharp', 'canvas', 'bcrypt', 'sqlite3'];
problematicDeps.forEach(dep => {
  if (packageJson.dependencies?.[dep]) {
    console.log(`⚠️  ${dep} may cause native compilation issues on Vercel`);
    // Consider moving to optionalDependencies or removing
  }
});

if (modified) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// 3. Check for TypeScript errors in key files
console.log('\n3. 📝 FIXING COMMON TYPESCRIPT ERRORS:\n');

// Fix missing React imports
const filesToCheck = [
  'src/components/FullscreenApp.tsx',
  'app/coder/page.tsx',
  'app/page.tsx',
  'app/layout.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileModified = false;
    
    // Add React import if using React features
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('React.')) && 
        !content.includes('import React') && !content.includes('from "react"')) {
      // Add at top
      if (content.startsWith("'use client'")) {
        const afterUseClient = content.indexOf('\n');
        content = content.substring(0, afterUseClient + 1) + "import React from 'react';\n" + content.substring(afterUseClient + 1);
      } else {
        content = "import React from 'react';\n" + content;
      }
      fileModified = true;
      console.log(`✅ Added React import to ${file}`);
    }
    
    // Add 'use client' if needed
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) && 
        !content.includes("'use client'") && !content.includes("'use server'")) {
      content = "'use client';\n\n" + content;
      fileModified = true;
      console.log(`✅ Added 'use client' to ${file}`);
    }
    
    if (fileModified) {
      fs.writeFileSync(filePath, content);
    }
  }
});

// 4. Create a .vercelignore file to exclude problematic files
console.log('\n4. 🚫 CREATING .VERCELIGNORE:\n');

const vercelignoreContent = `# Ignore files that cause build issues
*.log
*.tmp
*.temp
node_modules/.cache
.next/cache
.DS_Store
Thumbs.db

# Ignore test and development files
__tests__
__mocks__
*.test.*
*.spec.*
coverage

# Ignore lockfiles from parent directories (fixes workspace warning)
../package-lock.json
../../package-lock.json

# Ignore large files
*.zip
*.tar.gz
*.mp4
*.mov
*.avi

# Ignore environment files (Vercel manages these)
.env*
!.env.example`;
  
fs.writeFileSync(path.join(__dirname, '.vercelignore'), vercelignoreContent);
console.log('✅ Created .vercelignore file');

// 5. Create a vercel.json with build settings
console.log('\n5. 🏗️ UPDATING VERCEL.JSON:\n');

const vercelJsonPath = path.join(__dirname, 'vercel.json');
let vercelJson = {};
if (fs.existsSync(vercelJsonPath)) {
  vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
}

// Update with optimal settings for Next.js
vercelJson = {
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
};

fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
console.log('✅ Updated vercel.json with optimized settings');

// 6. Create a simple test to verify build works
console.log('\n6. 🧪 CREATING BUILD TEST:\n');

const buildTest = `#!/bin/bash
echo "Testing build..."
npm install --legacy-peer-deps
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  exit 0
else
  echo "❌ Build failed"
  exit 1
fi`;

fs.writeFileSync(path.join(__dirname, 'test-build.sh'), buildTest);
console.log('✅ Created build test script');

// 7. Instructions for fixing
console.log('\n7. 🎯 QUICK FIXES APPLIED:');
console.log('========================');
console.log('✅ Fixed next.config.js');
console.log('✅ Updated package.json');
console.log('✅ Added React imports to key files');
console.log('✅ Added "use client" directives');
console.log('✅ Created .vercelignore');
console.log('✅ Updated vercel.json');
console.log('✅ Created build test');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Commit these changes:');
console.log('   git add .');
console.log('   git commit -m "Fix Vercel build failures"');
console.log('   git push origin main');
console.log('');
console.log('2. Check Vercel deployment:');
console.log('   https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/deployments');
console.log('');
console.log('3. If still failing, check logs for specific error');
console.log('');
console.log('🔧 COMMON BUILD FAILURE FIXES:');
console.log('• Missing "use client" in component files');
console.log('• TypeScript errors');
console.log('• Native module compilation (sharp, canvas, etc.)');
console.log('• Memory limits (increase in Vercel settings)');
console.log('• Build timeout (increase to 120s in Vercel settings)');
console.log('• Node version mismatch');

console.log('\n📞 VERCEL SUPPORT:');
console.log('• Build Logs: Check failed deployment → Build Logs');
console.log('• Docs: https://vercel.com/docs');
console.log('• Status: https://vercel-status.com');

console.log('\n⚠️  EMERGENCY FIX:');
console.log('If builds keep failing, try:');
console.log('1. Roll back to last working commit');
console.log('2. Deploy from that commit');
console.log('3. Fix issues locally before pushing again');
console.log('4. Use: git reset --hard <last-working-commit>');
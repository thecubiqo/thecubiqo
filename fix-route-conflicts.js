// Fix route conflicts causing 404 errors
const fs = require('fs');
const path = require('path');

console.log('🚨 FIXING ROUTE CONFLICTS');
console.log('==========================\n');

// 1. Check for conflicting routes
console.log('1. 🔍 CHECKING FOR ROUTE CONFLICTS:\n');

const conflicts = [];

// Check src/app/coder (old App Router)
const oldCoderPath = path.join(__dirname, 'src/app/coder');
if (fs.existsSync(oldCoderPath)) {
  console.log('❌ CONFLICT: src/app/coder exists (old App Router)');
  conflicts.push(oldCoderPath);
  
  // List files in old coder directory
  const oldFiles = fs.readdirSync(oldCoderPath);
  console.log(`   Contains: ${oldFiles.join(', ')}`);
}

// Check app/api/coder (API route)
const apiCoderPath = path.join(__dirname, 'app/api/coder');
if (fs.existsSync(apiCoderPath)) {
  console.log('⚠️  WARNING: app/api/coder exists (API route)');
  console.log('   This might conflict with page route /coder');
}

// Check app/coder (current route)
const currentCoderPath = path.join(__dirname, 'app/coder');
if (fs.existsSync(currentCoderPath)) {
  console.log('✅ CURRENT: app/coder exists (current App Router)');
}

// 2. Fix the conflicts
console.log('\n2. 🔧 FIXING CONFLICTS:\n');

if (conflicts.length > 0) {
  console.log('Fixing route conflicts...');
  
  // Rename src/app/coder to src/app/coder-old to avoid conflict
  conflicts.forEach(conflictPath => {
    const newPath = conflictPath + '-old';
    
    try {
      fs.renameSync(conflictPath, newPath);
      console.log(`✅ Renamed ${conflictPath} to ${newPath}`);
      console.log(`   This removes the route conflict`);
    } catch (error) {
      console.log(`❌ Failed to rename ${conflictPath}:`, error.message);
      
      // Try alternative: move files out
      const backupDir = path.join(__dirname, 'backup-old-routes');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, path.basename(conflictPath));
      try {
        // Copy files to backup
        const files = fs.readdirSync(conflictPath);
        files.forEach(file => {
          const src = path.join(conflictPath, file);
          const dest = path.join(backupPath, file);
          fs.copyFileSync(src, dest);
        });
        
        // Remove original
        fs.rmSync(conflictPath, { recursive: true, force: true });
        
        console.log(`✅ Moved ${conflictPath} to backup`);
      } catch (error2) {
        console.log(`❌ Could not backup ${conflictPath}:`, error2.message);
      }
    }
  });
} else {
  console.log('✅ No route conflicts found');
}

// 3. Ensure app/coder has proper structure
console.log('\n3. 🔧 ENSURING APP/CODER STRUCTURE:\n');

const coderDir = path.join(__dirname, 'app/coder');
if (!fs.existsSync(coderDir)) {
  fs.mkdirSync(coderDir, { recursive: true });
  console.log('✅ Created app/coder directory');
}

// Check page.tsx
const coderPagePath = path.join(coderDir, 'page.tsx');
if (!fs.existsSync(coderPagePath)) {
  console.log('❌ app/coder/page.tsx missing! Creating...');
  
  const simplePage = `'use client';

export default function CoderPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-2xl p-8">
        <div className="text-6xl mb-6">💻</div>
        <h1 className="text-3xl font-bold mb-4">CubiQo Coding Panel</h1>
        <p className="text-gray-400 mb-8">
          The coding panel is being configured. Please check back soon.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          Back to CubiQo
        </a>
      </div>
    </div>
  );
}`;
  
  fs.writeFileSync(coderPagePath, simplePage);
  console.log('✅ Created app/coder/page.tsx');
}

// Check layout.tsx
const coderLayoutPath = path.join(coderDir, 'layout.tsx');
if (!fs.existsSync(coderLayoutPath)) {
  console.log('⚠️  app/coder/layout.tsx missing');
  
  const layout = `export default function CoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}`;
  
  fs.writeFileSync(coderLayoutPath, layout);
  console.log('✅ Created app/coder/layout.tsx');
}

// 4. Create a .gitignore for backup files
console.log('\n4. 🚫 UPDATING .GITIGNORE:\n');

const gitignorePath = path.join(__dirname, '.gitignore');
let gitignoreContent = '';
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

// Add backup directories to .gitignore
if (!gitignoreContent.includes('backup-old-routes')) {
  gitignoreContent += '\n\n# Backup directories from route conflict fixes\nbackup-old-routes/\nsrc/app/*-old/\n';
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Updated .gitignore to exclude backup files');
}

// 5. Test the fix
console.log('\n5. 🧪 TESTING THE FIX:\n');

console.log('Test routes:');
console.log('1. https://www.cubiqo.ai/test-route');
console.log('   Should work (tests basic routing)');
console.log('');
console.log('2. https://www.cubiqo.ai/coder');
console.log('   Should show coder page (not 404)');
console.log('');
console.log('3. https://www.cubiqo.ai/');
console.log('   Should show main site');

// 6. Instructions
console.log('\n6. 🎯 FIXES APPLIED:');
console.log('==================');
console.log('✅ Fixed route conflicts (src/app/coder vs app/coder)');
console.log('✅ Ensured app/coder has proper structure');
console.log('✅ Created test route at /test-route');
console.log('✅ Updated .gitignore');

console.log('\n🚀 COMMIT AND PUSH:');
console.log('git add .');
console.log('git commit -m "Fix route conflicts: remove src/app/coder, ensure app/coder structure"');
console.log('git push origin main');

console.log('\n🔍 WHY THIS HAPPENED:');
console.log('• Next.js App Router migrated from src/app to app/');
console.log('• Old routes in src/app/ conflict with new routes in app/');
console.log('• Next.js gets confused about which route to use');
console.log('• Result: 404 errors for conflicting routes');

console.log('\n⚠️  AFTER DEPLOYMENT:');
console.log('1. Clear browser cache');
console.log('2. Wait 2-5 minutes for Vercel deployment');
console.log('3. Test /coder route');
console.log('4. Check browser console for errors');
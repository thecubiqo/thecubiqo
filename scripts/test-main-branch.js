/**
 * Test Main Branch Feature Completeness
 * Validates what features exist in main branch
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  MAIN BRANCH FEATURE AUDIT');
console.log('============================\n');

// Check for feature directories
console.log('1. FEATURE DIRECTORY CHECK');
console.log('-------------------------');

const featureDirs = [
  { path: 'src/app/api/rgy', name: 'RGY Matching' },
  { path: 'src/app/api/job-hunt', name: 'Job Hunt Mode' },
  { path: 'src/app/api/emergent', name: 'Emergent Studio' },
  { path: 'src/app/api/monitoring', name: 'Monitoring' },
  { path: 'src/app/api/privacy', name: 'Security/Privacy' },
  { path: 'src/app/founders-pass', name: 'Founders Pass' },
  { path: 'src/app/journal', name: 'Journal' },
  { path: 'src/app/api/admin', name: 'Admin Dashboard' }
];

let featureCount = 0;
featureDirs.forEach(({ path: dirPath, name }) => {
  if (fs.existsSync(dirPath)) {
    const files = getAllFiles(dirPath).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    const routeFiles = files.filter(f => f.includes('route.ts'));
    const componentFiles = files.filter(f => f.includes('.tsx') && !f.includes('route.ts'));
    
    console.log(`   ✅ ${name}:`);
    console.log(`      Files: ${files.length} (${routeFiles.length} routes, ${componentFiles.length} components)`);
    featureCount++;
  } else {
    console.log(`   ❌ ${name}: Not found in main`);
  }
});

console.log(`\n   Total features in main: ${featureCount}/${featureDirs.length}`);

// Check for database migrations
console.log('\n2. DATABASE MIGRATION CHECK');
console.log('--------------------------');

const migrationsDir = 'supabase/migrations';
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`   Found ${migrationFiles.length} migration files`);
  
  // Check for feature-specific migrations
  const featureMigrations = migrationFiles.filter(f => 
    f.includes('rgy') || 
    f.includes('job') || 
    f.includes('emergent') || 
    f.includes('monitoring') ||
    f.includes('privacy') ||
    f.includes('security')
  );
  
  if (featureMigrations.length > 0) {
    console.log('   Feature migrations found:');
    featureMigrations.forEach(migration => {
      console.log(`      ✅ ${migration}`);
    });
  } else {
    console.log('   ⚠️  No feature-specific migrations found');
  }
} else {
  console.log('   ❌ Migrations directory not found');
}

// Check for monetisation references
console.log('\n3. MONETISATION CHECK');
console.log('--------------------');

// Look for pricing, subscription, or monetisation references
const searchPaths = ['src', 'public', 'docs'];
const monetisationPatterns = [
  'pricing',
  'subscription', 
  'premium',
  'enterprise',
  'monetisation',
  'revenue',
  'tier',
  '$',
  'price'
];

let monetisationFiles = [];
searchPaths.forEach(searchPath => {
  if (fs.existsSync(searchPath)) {
    const files = getAllFiles(searchPath);
    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
        try {
          const content = fs.readFileSync(file, 'utf8').toLowerCase();
          const hasMonetisation = monetisationPatterns.some(pattern => 
            content.includes(pattern.toLowerCase())
          );
          if (hasMonetisation) {
            monetisationFiles.push(file);
          }
        } catch (err) {
          // Skip unreadable files
        }
      }
    });
  }
});

console.log(`   Found ${monetisationFiles.length} files with monetisation references`);
if (monetisationFiles.length > 0) {
  console.log('   Sample files:');
  monetisationFiles.slice(0, 3).forEach(file => {
    console.log(`      📄 ${file}`);
  });
}

// Check for UI components
console.log('\n4. UI COMPONENT CHECK');
console.log('--------------------');

const uiComponents = [
  { path: 'src/components', name: 'General Components' },
  { path: 'src/app/components', name: 'App Components' },
  { path: 'src/app/(dashboard)', name: 'Dashboard Pages' },
  { path: 'src/app/(auth)', name: 'Auth Pages' }
];

uiComponents.forEach(({ path: dirPath, name }) => {
  if (fs.existsSync(dirPath)) {
    const files = getAllFiles(dirPath).filter(f => f.endsWith('.tsx'));
    console.log(`   ✅ ${name}: ${files.length} components`);
  } else {
    console.log(`   ❌ ${name}: Not found`);
  }
});

// Summary
console.log('\n📊 MAIN BRANCH SUMMARY');
console.log('=====================');

const results = {
  features: featureCount,
  totalFeatures: featureDirs.length,
  hasMigrations: fs.existsSync(migrationsDir),
  monetisationFiles: monetisationFiles.length,
  hasUI: uiComponents.some(({ path: dirPath }) => fs.existsSync(dirPath))
};

console.log(`   Features implemented: ${results.features}/${results.totalFeatures}`);
console.log(`   Database migrations: ${results.hasMigrations ? '✅ Yes' : '❌ No'}`);
console.log(`   Monetisation references: ${results.monetisationFiles} files`);
console.log(`   UI components: ${results.hasUI ? '✅ Yes' : '❌ No'}`);

console.log('\n🎯 ASSESSMENT:');
if (results.features === 0) {
  console.log('   ❌ MAIN BRANCH HAS NO FEATURES');
  console.log('      All features are in PRs, not merged to main');
} else if (results.features < results.totalFeatures / 2) {
  console.log('   ⚠️  MAIN BRANCH HAS FEW FEATURES');
  console.log('      Most features still in PRs');
} else {
  console.log('   ✅ MAIN BRANCH HAS FEATURES');
  console.log('      Some features are deployed');
}

console.log('\n🚀 NEXT: Testing staging0217 branch...');

// Helper function
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}
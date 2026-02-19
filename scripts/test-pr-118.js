/**
 * Test PR #118 - Job Hunt Mode
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING PR #118 - Job Hunt Mode');
console.log('==================================\n');

const tests = {
  api: false,
  db: false,
  ui: false,
  build: false,
  dependencies: false,
  monetisation: false  // This PR needs monetisation
};

// Test 1: Check API endpoints
console.log('1. API ENDPOINTS TEST');
console.log('-------------------');

const apiDir = 'src/app/api/job-hunt';
if (fs.existsSync(apiDir)) {
  const apiFiles = getAllFiles(apiDir).filter(f => f.endsWith('.ts') && f.includes('route.ts'));
  
  console.log(`   Found ${apiFiles.length} API route files:`);
  apiFiles.forEach(file => {
    const relativePath = path.relative(apiDir, file);
    console.log(`   ✅ ${relativePath}`);
  });
  
  tests.api = apiFiles.length > 0;
  console.log(`   Result: ${tests.api ? '✅ PASS' : '❌ FAIL'}`);
} else {
  console.log('   ❌ Job Hunt API directory not found');
}

// Test 2: Check database migration
console.log('\n2. DATABASE MIGRATION TEST');
console.log('-------------------------');

// Look for job hunt migration
const migrationsDir = 'supabase/migrations';
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.includes('job') || f.includes('20260218000002'));
  
  if (migrationFiles.length > 0) {
    console.log(`   Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => {
      console.log(`   ✅ ${file}`);
      
      // Check migration content
      try {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        const hasJobTables = content.toLowerCase().includes('job') || 
                             content.toLowerCase().includes('hunt') ||
                             content.toLowerCase().includes('application');
        
        if (hasJobTables) {
          console.log(`      Contains job-related tables`);
          tests.db = true;
        }
      } catch (error) {
        console.log(`      Error reading: ${error.message}`);
      }
    });
  } else {
    console.log('   ❌ No job hunt migration files found');
  }
  
  console.log(`   Result: ${tests.db ? '✅ PASS' : '❌ FAIL'}`);
} else {
  console.log('   ❌ Migrations directory not found');
}

// Test 3: Check UI components
console.log('\n3. UI COMPONENTS TEST');
console.log('--------------------');

const jobComponents = getAllFiles('src')
  .filter(f => (f.toLowerCase().includes('job') || f.toLowerCase().includes('hunt')) && 
                (f.endsWith('.tsx') || f.endsWith('.ts')));

if (jobComponents.length > 0) {
  console.log(`   Found ${jobComponents.length} job hunt components:`);
  jobComponents.slice(0, 5).forEach(comp => {
    console.log(`   ✅ ${path.relative(process.cwd(), comp)}`);
  });
  if (jobComponents.length > 5) {
    console.log(`   ... and ${jobComponents.length - 5} more`);
  }
  
  tests.ui = jobComponents.length >= 3;
  console.log(`   Result: ${tests.ui ? '✅ PASS' : '❌ FAIL'}`);
} else {
  console.log('   ❌ No job hunt components found');
}

// Test 4: Check for monetisation (this is the gap)
console.log('\n4. MONETISATION CHECK');
console.log('--------------------');

// Look for pricing references
const pricingKeywords = ['pricing', 'premium', 'subscription', '$', 'price', 'tier'];
let hasMonetisation = false;

// Check API files
if (fs.existsSync(apiDir)) {
  const apiFiles = getAllFiles(apiDir).filter(f => f.endsWith('.ts'));
  
  apiFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      if (pricingKeywords.some(keyword => content.includes(keyword))) {
        console.log(`   Found monetisation reference in: ${path.basename(file)}`);
        hasMonetisation = true;
      }
    } catch (error) {
      // Skip unreadable files
    }
  });
}

// Check components
jobComponents.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    if (pricingKeywords.some(keyword => content.includes(keyword))) {
      console.log(`   Found monetisation reference in: ${path.basename(file)}`);
      hasMonetisation = true;
    }
  } catch (error) {
    // Skip unreadable files
  }
});

tests.monetisation = hasMonetisation;
console.log(`   Result: ${tests.monetisation ? '✅ PASS' : '❌ FAIL (NEEDS MONETISATION)'}`);

if (!tests.monetisation) {
  console.log(`   💡 This PR needs monetisation tie-in from PR #132`);
  console.log(`   💡 Suggested: Add Job Hunt as Premium feature ($19/mo)`);
}

// Test 5: Check dependencies
console.log('\n5. DEPENDENCIES TEST');
console.log('-------------------');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Job hunt might need specific dependencies
  const jobDeps = ['@supabase/supabase-js']; // At least Supabase
  const foundDeps = jobDeps.filter(dep => deps[dep]);
  
  console.log(`   Required dependencies: ${foundDeps.length}/${jobDeps.length} found`);
  jobDeps.forEach(dep => {
    console.log(`   ${deps[dep] ? '✅' : '❌'} ${dep}`);
  });
  
  tests.dependencies = foundDeps.length >= 1;
  console.log(`   Result: ${tests.dependencies ? '✅ PASS' : '❌ FAIL'}`);
} catch (error) {
  console.log(`   ❌ Could not read package.json: ${error.message}`);
}

// Test 6: Build check
console.log('\n6. BUILD CHECK');
console.log('--------------');

try {
  // Check TypeScript config
  if (fs.existsSync('tsconfig.json')) {
    console.log('   ✅ TypeScript config found');
    
    // Simple syntax check on a few files
    let syntaxErrors = 0;
    const sampleFiles = jobComponents.slice(0, 3);
    
    sampleFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Basic React component check
        if (content.includes('export default') || content.includes('export function') || content.includes('export const')) {
          if (!content.includes('import React') && !content.includes('import {') && content.includes('React')) {
            console.log(`   ⚠️  ${path.basename(file)}: Possible missing import`);
            syntaxErrors++;
          }
        }
      } catch (error) {
        console.log(`   ❌ ${path.basename(file)}: ${error.message}`);
        syntaxErrors++;
      }
    });
    
    tests.build = syntaxErrors === 0;
    console.log(`   Result: ${tests.build ? '✅ PASS' : '❌ FAIL'} (${syntaxErrors} syntax issues)`);
  } else {
    console.log('   ❌ TypeScript config not found');
  }
} catch (error) {
  console.log(`   ❌ Build check failed: ${error.message}`);
}

// Summary
console.log('\n📊 TEST SUMMARY');
console.log('==============\n');

const totalTests = Object.keys(tests).length;
const passedTests = Object.values(tests).filter(Boolean).length;

console.log(`Tests passed: ${passedTests}/${totalTests}`);
console.log('');
Object.entries(tests).forEach(([test, passed]) => {
  const emoji = passed ? '✅' : (test === 'monetisation' ? '⚠️' : '❌');
  console.log(`${emoji} ${test.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`);
});

console.log('\n🎯 VERDICT:');
if (passedTests >= 4 && tests.api && tests.db && tests.ui) {
  console.log('✅ PR #118 IS READY (except monetisation)');
  console.log('   Can merge after adding monetisation from PR #132');
} else if (passedTests >= 3) {
  console.log('⚠️  PR #118 IS NEARLY READY');
  console.log(`   ${totalTests - passedTests} test(s) need attention`);
} else {
  console.log('❌ PR #118 NEEDS WORK');
  console.log(`   Only ${passedTests}/${totalTests} tests pass`);
}

console.log('\n🚀 RECOMMENDED ACTION:');
if (!tests.monetisation) {
  console.log('1. Merge PR #132 first (Monetisation Strategy)');
  console.log('2. Update PR #118 with pricing tier from #132');
  console.log('3. Then merge PR #118');
}

if (!tests.api) {
  console.log('1. Check API endpoints');
}
if (!tests.db) {
  console.log('2. Verify database migration');
}
if (!tests.ui) {
  console.log('3. Check UI components');
}

console.log('\n💡 MONETISATION SUGGESTION:');
console.log('   Add to PR #118 before merging:');
console.log('   - Job Hunt as Premium feature ($19/month)');
console.log('   - Or as standalone add-on ($49 one-time)');
console.log('   - Include in pricing page');
console.log('   - Add feature flag for free vs premium');

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
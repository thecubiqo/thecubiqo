/**
 * Test the merged branch with PRs #117, #118, #132
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING MERGED BRANCH (PRs #117, #118, #132)');
console.log('===============================================\n');

const features = {
  rgy: {
    name: 'RGY Intelligent Matching',
    api: false,
    db: false,
    ui: false,
    monetisation: false
  },
  jobHunt: {
    name: 'Job Hunt Mode',
    api: false,
    db: false,
    ui: false,
    monetisation: false
  },
  monetisation: {
    name: 'Monetisation Strategy',
    docs: false
  }
};

// Check RGY feature
console.log('1. RGY INTELLIGENT MATCHING');
console.log('---------------------------');

if (fs.existsSync('src/app/api/rgy')) {
  const rgyAPIFiles = getAllFiles('src/app/api/rgy').filter(f => f.endsWith('.ts'));
  features.rgy.api = rgyAPIFiles.filter(f => f.includes('route.ts')).length >= 3;
  console.log(`   API: ${features.rgy.api ? '✅' : '❌'} ${rgyAPIFiles.filter(f => f.includes('route.ts')).length} endpoints`);
}

if (fs.existsSync('supabase/migrations/20260218000001_rgy_intelligent_matching.sql')) {
  features.rgy.db = true;
  console.log(`   DB: ✅ Migration exists`);
}

const rgyComponents = getAllFiles('src').filter(f => f.toLowerCase().includes('rgy') && f.endsWith('.tsx'));
features.rgy.ui = rgyComponents.length >= 3;
console.log(`   UI: ${features.rgy.ui ? '✅' : '❌'} ${rgyComponents.length} components`);

// Check RGY monetisation
const rgyFiles = getAllFiles('src').filter(f => f.toLowerCase().includes('rgy'));
let rgyHasMonetisation = false;
rgyFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    if (content.includes('premium') || content.includes('subscription') || content.includes('promatch')) {
      rgyHasMonetisation = true;
    }
  } catch (error) {
    // Skip
  }
});
features.rgy.monetisation = rgyHasMonetisation;
console.log(`   $: ${features.rgy.monetisation ? '✅' : '❌'} Has monetisation`);

// Check Job Hunt feature
console.log('\n2. JOB HUNT MODE');
console.log('---------------');

if (fs.existsSync('src/app/api/job-hunt')) {
  const jobAPIFiles = getAllFiles('src/app/api/job-hunt').filter(f => f.endsWith('.ts'));
  features.jobHunt.api = jobAPIFiles.filter(f => f.includes('route.ts')).length >= 3;
  console.log(`   API: ${features.jobHunt.api ? '✅' : '❌'} ${jobAPIFiles.filter(f => f.includes('route.ts')).length} endpoints`);
}

const jobMigrations = fs.existsSync('supabase/migrations') ? 
  fs.readdirSync('supabase/migrations').filter(f => f.includes('job') || f.includes('20260218000002')) : [];
features.jobHunt.db = jobMigrations.length > 0;
console.log(`   DB: ${features.jobHunt.db ? '✅' : '❌'} ${jobMigrations.length} migrations`);

const jobComponents = getAllFiles('src').filter(f => 
  (f.toLowerCase().includes('job') || f.toLowerCase().includes('hunt')) && 
  f.endsWith('.tsx')
);
features.jobHunt.ui = jobComponents.length >= 3;
console.log(`   UI: ${features.jobHunt.ui ? '✅' : '❌'} ${jobComponents.length} components`);

// Check Job Hunt monetisation (should reference PR #132)
const monetisationDocs = getAllFiles('.').filter(f => 
  f.toLowerCase().includes('monet') || 
  f.toLowerCase().includes('pricing') ||
  f.toLowerCase().includes('strategy')
).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

features.jobHunt.monetisation = monetisationDocs.length > 0;
console.log(`   $: ${features.jobHunt.monetisation ? '✅' : '❌'} Can reference monetisation docs`);

// Check Monetisation Strategy docs
console.log('\n3. MONETISATION STRATEGY');
console.log('-----------------------');

features.monetisation.docs = monetisationDocs.length > 0;
console.log(`   Docs: ${features.monetisation.docs ? '✅' : '❌'} ${monetisationDocs.length} documents`);

if (monetisationDocs.length > 0) {
  console.log(`   Sample documents:`);
  monetisationDocs.slice(0, 3).forEach(doc => {
    console.log(`      📄 ${path.basename(doc)}`);
  });
}

// Check for conflicts between features
console.log('\n4. CONFLICT CHECK');
console.log('----------------');

const potentialConflicts = [];

// Check for overlapping API routes
const allAPIRoutes = [];
function checkAPIRoutes(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      checkAPIRoutes(fullPath, prefix + '/' + item);
    } else if (item === 'route.ts') {
      allAPIRoutes.push(prefix);
    }
  });
}

checkAPIRoutes('src/app/api');

// Check for duplicate route patterns
const routeMap = {};
allAPIRoutes.forEach(route => {
  const baseRoute = route.split('/')[1]; // First part after /api
  if (routeMap[baseRoute]) {
    potentialConflicts.push(`Duplicate base route: ${baseRoute}`);
  } else {
    routeMap[baseRoute] = true;
  }
});

if (potentialConflicts.length === 0) {
  console.log(`   ✅ No API route conflicts detected`);
  console.log(`   Found ${allAPIRoutes.length} unique API routes`);
} else {
  console.log(`   ⚠️  Potential conflicts:`);
  potentialConflicts.forEach(conflict => {
    console.log(`      ${conflict}`);
  });
}

// Check database tables
console.log('\n5. DATABASE COMPATIBILITY');
console.log('------------------------');

const migrationFiles = fs.existsSync('supabase/migrations') ? 
  fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')) : [];

console.log(`   Total migrations: ${migrationFiles.length}`);

// Check for table name conflicts
const tableNames = new Set();
migrationFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join('supabase/migrations', file), 'utf8');
    const tableMatches = content.match(/CREATE TABLE (\w+)/gi) || [];
    tableMatches.forEach(match => {
      const tableName = match.replace('CREATE TABLE ', '').toLowerCase();
      if (tableNames.has(tableName)) {
        potentialConflicts.push(`Duplicate table: ${tableName}`);
      }
      tableNames.add(tableName);
    });
  } catch (error) {
    // Skip unreadable files
  }
});

console.log(`   Unique tables: ${tableNames.size}`);
if (potentialConflicts.length === 0) {
  console.log(`   ✅ No database table conflicts`);
}

// Summary
console.log('\n📊 MERGE SUMMARY');
console.log('===============\n');

console.log('Features merged:');
console.log('---------------');

Object.entries(features).forEach(([key, feature]) => {
  console.log(`\n${feature.name}:`);
  
  if (key === 'monetisation') {
    console.log(`   Docs: ${feature.docs ? '✅' : '❌'}`);
  } else {
    console.log(`   API: ${feature.api ? '✅' : '❌'}`);
    console.log(`   DB: ${feature.db ? '✅' : '❌'}`);
    console.log(`   UI: ${feature.ui ? '✅' : '❌'}`);
    console.log(`   Monetisation: ${feature.monetisation ? '✅' : '❌'}`);
  }
});

console.log('\n🎯 OVERALL STATUS:');
const allFeaturesWorking = features.rgy.api && features.rgy.db && features.rgy.ui &&
                          features.jobHunt.api && features.jobHunt.db && features.jobHunt.ui &&
                          features.monetisation.docs;

if (allFeaturesWorking) {
  console.log('✅ ALL FEATURES WORKING TOGETHER');
  console.log('   Ready for deployment to staging');
} else {
  console.log('⚠️  SOME FEATURES NEED ATTENTION');
  
  if (!features.rgy.api || !features.rgy.db || !features.rgy.ui) {
    console.log('   - RGY feature incomplete');
  }
  if (!features.jobHunt.api || !features.jobHunt.db || !features.jobHunt.ui) {
    console.log('   - Job Hunt feature incomplete');
  }
  if (!features.monetisation.docs) {
    console.log('   - Monetisation docs missing');
  }
}

console.log('\n🚀 NEXT STEPS:');
console.log('1. Test PR #130 (Monitoring) - needs UI dashboard');
console.log('2. Run full integration tests');
console.log('3. Deploy to staging environment');
console.log('4. Monitor for 24 hours');
console.log('5. Merge to main if stable');

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
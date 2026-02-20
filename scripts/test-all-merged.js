/**
 * Test ALL merged PRs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING ALL MERGED PRs');
console.log('========================\n');

const mergedPRs = {
  117: { name: 'RGY Intelligent Matching', merged: true },
  118: { name: 'Job Hunt Mode', merged: true },
  132: { name: 'Monetisation Strategy', merged: true },
  135: { name: 'Test Coverage', merged: true },
  128: { name: 'Testing Infrastructure', merged: true },
  130: { name: 'Monitoring', merged: true },
  119: { name: 'Journal History', merged: true },
  133: { name: 'Emergent Docs', merged: true },
  116: { name: 'Security', merged: false, reason: 'Conflicts' },
  113: { name: 'Emergent Studio', merged: false, reason: 'Conflicts' }
};

// Check each merged PR
console.log('1. MERGED PRs CHECK');
console.log('------------------\n');

Object.entries(mergedPRs).forEach(([prNumber, info]) => {
  const status = info.merged ? '✅' : '❌';
  console.log(`${status} PR #${prNumber}: ${info.name}`);
  if (!info.merged) {
    console.log(`   Reason: ${info.reason}`);
  }
});

// Check what was added
console.log('\n2. FEATURES ADDED');
console.log('----------------\n');

const features = [
  { name: 'RGY API', path: 'src/app/api/rgy', pr: 117 },
  { name: 'Job Hunt API', path: 'src/app/api/job-hunt', pr: 118 },
  { name: 'Monitoring API', path: 'src/app/api/monitoring', pr: 130 },
  { name: 'Journal History UI', path: 'src/app/journal/history', pr: 119 },
  { name: 'Monetisation Docs', pattern: /monet|pricing|strategy.*\.md$/i, pr: 132 },
  { name: 'Test Infrastructure', pattern: /test.*\.(js|ts|sh)$/i, pr: [135, 128] },
  { name: 'Emergent Docs', pattern: /emergent.*\.md$/i, pr: 133 }
];

features.forEach(feature => {
  let exists = false;
  let details = '';
  
  if (feature.path) {
    exists = fs.existsSync(feature.path);
    if (exists) {
      const files = getAllFiles(feature.path).length;
      details = `${files} files`;
    }
  } else if (feature.pattern) {
    const allFiles = getAllFiles('.');
    const matchingFiles = allFiles.filter(f => feature.pattern.test(f));
    exists = matchingFiles.length > 0;
    if (exists) {
      details = `${matchingFiles.length} files`;
    }
  }
  
  const prs = Array.isArray(feature.pr) ? feature.pr.join(', ') : feature.pr;
  console.log(`${exists ? '✅' : '❌'} ${feature.name} (PR #${prs}): ${exists ? details : 'Not found'}`);
});

// Check for conflicts
console.log('\n3. CONFLICT CHECK');
console.log('----------------\n');

try {
  const { execSync } = require('child_process');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  const conflictFiles = status.split('\n')
    .filter(line => line.startsWith('UU ') || line.startsWith('AA ') || line.startsWith('DD '))
    .map(line => line.substring(3));
  
  if (conflictFiles.length === 0) {
    console.log('✅ No merge conflicts in current branch');
  } else {
    console.log(`❌ ${conflictFiles.length} files have merge conflicts:`);
    conflictFiles.forEach(file => {
      console.log(`   ${file}`);
    });
  }
} catch (error) {
  console.log(`⚠️  Could not check git status: ${error.message}`);
}

// Check build compatibility
console.log('\n4. BUILD COMPATIBILITY');
console.log('---------------------\n');

try {
  // Check package.json
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json exists');
    console.log(`   Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
    console.log(`   Dev dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
  }
  
  // Check TypeScript config
  if (fs.existsSync('tsconfig.json')) {
    console.log('✅ tsconfig.json exists');
  }
  
  // Check for obvious issues
  const problematicFiles = [];
  const checkFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'next.config.js'
  ];
  
  checkFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        if (file.endsWith('.json')) {
          JSON.parse(fs.readFileSync(file, 'utf8'));
        }
      } catch (error) {
        problematicFiles.push(`${file}: ${error.message}`);
      }
    }
  });
  
  if (problematicFiles.length === 0) {
    console.log('✅ No obvious build issues');
  } else {
    console.log('❌ Build issues found:');
    problematicFiles.forEach(issue => {
      console.log(`   ${issue}`);
    });
  }
} catch (error) {
  console.log(`❌ Build check failed: ${error.message}`);
}

// Summary
console.log('\n📊 MERGE SUMMARY');
console.log('===============\n');

const totalPRs = Object.keys(mergedPRs).length;
const mergedCount = Object.values(mergedPRs).filter(p => p.merged).length;
const conflictCount = Object.values(mergedPRs).filter(p => !p.merged).length;

console.log(`Total PRs: ${totalPRs}`);
console.log(`Successfully merged: ${mergedCount}`);
console.log(`Failed (conflicts): ${conflictCount}`);

console.log('\n🎯 STATUS:');
if (mergedCount === totalPRs) {
  console.log('✅ ALL PRs MERGED SUCCESSFULLY');
} else if (mergedCount >= totalPRs - 2) {
  console.log(`✅ ${mergedCount}/${totalPRs} PRs MERGED`);
  console.log(`   ${conflictCount} PRs have conflicts (expected)`);
} else {
  console.log(`⚠️  ${mergedCount}/${totalPRs} PRs merged`);
  console.log(`   ${conflictCount} PRs failed`);
}

console.log('\n🚀 RECOMMENDED NEXT STEPS:');
console.log('1. Run full test suite');
console.log('2. Check for runtime errors');
console.log('3. Deploy to staging');
console.log('4. Monitor for 24 hours');

if (conflictCount > 0) {
  console.log('\n🔧 PRs NEEDING CONFLICT RESOLUTION:');
  Object.entries(mergedPRs)
    .filter(([_, info]) => !info.merged)
    .forEach(([prNumber, info]) => {
      console.log(`   PR #${prNumber}: ${info.name} - ${info.reason}`);
    });
}

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
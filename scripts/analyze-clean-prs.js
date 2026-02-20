/**
 * Analyze PRs that are tested, have API/DB working, and no conflicts
 */

const fs = require('fs');

console.log('🔍 ANALYZING CLEAN PRs (No conflicts, API/DB working)');
console.log('===================================================\n');

// Read the PR readiness report
const reportPath = 'PR_READINESS_REPORT.md';
if (!fs.existsSync(reportPath)) {
  console.log('❌ PR readiness report not found');
  process.exit(1);
}

const reportContent = fs.readFileSync(reportPath, 'utf8');

// Extract PR sections
const prSections = reportContent.split('### PR #');
console.log(`Found ${prSections.length - 1} PR analyses\n`);

// Criteria for "clean" PRs:
// 1. Mergeable (no conflicts)
// 2. API working (✅ or ⚠️ but functional)
// 3. DB working (✅ or ⚠️ but functional)
// 4. No conflicting UI screens
// 5. Dependencies functional

const cleanPRs = [];
const prNumbers = [116, 119, 128, 118, 113, 133, 132, 130, 117, 135];

prNumbers.forEach(prNumber => {
  const prSection = prSections.find(section => section.startsWith(`${prNumber}`));
  if (!prSection) {
    console.log(`❌ PR #${prNumber}: Not found in report`);
    return;
  }

  const lines = prSection.split('\n');
  
  // Extract key information
  const titleLine = lines.find(l => l.includes('**Status:**'));
  const status = titleLine ? titleLine.split('**Status:**')[1]?.trim() : '';
  
  // Check for conflicts
  const hasConflicts = status.includes('NOT mergeable') || status.includes('merge conflicts') || 
                       status.includes('mergeable_state: dirty');
  
  // Check API status
  const apiLine = lines.find(l => l.includes('**API:**'));
  const apiStatus = apiLine ? apiLine.includes('✅') ? '✅' : apiLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
  const apiWorking = apiStatus === '✅' || (apiStatus === '⚠️' && apiLine?.includes('existing') && !apiLine?.includes('no new endpoints'));
  
  // Check DB status
  const dbLine = lines.find(l => l.includes('**Database:**'));
  const dbStatus = dbLine ? dbLine.includes('✅') ? '✅' : dbLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
  const dbWorking = dbStatus === '✅' || (dbStatus === '⚠️' && dbLine?.includes('existing') && !dbLine?.includes('no DB changes'));
  
  // Check UI status
  const uiLine = lines.find(l => l.includes('**UI Spec:**'));
  const uiStatus = uiLine ? uiLine.includes('✅') ? '✅' : uiLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
  const uiComplete = uiStatus === '✅' || (uiStatus === '⚠️' && !uiLine?.includes('no UI component') && !uiLine?.includes('no UI changes'));
  
  // Check dependencies
  const depsLine = lines.find(l => l.includes('**Dependencies:**'));
  const depsStatus = depsLine ? depsLine.includes('✅') ? '✅' : depsLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
  const depsWorking = depsStatus === '✅';
  
  // Check for conflicting UI screens
  const hasConflictingUI = lines.some(l => 
    l.includes('conflict') || 
    l.includes('overlap') || 
    l.includes('duplicate') ||
    l.includes('competing')
  );
  
  // Check if tested
  const isTested = lines.some(l => 
    l.includes('tests') || 
    l.includes('Vercel deploys') ||
    l.includes('build passes') ||
    l.includes('CodeQL')
  );
  
  // Determine if PR meets criteria
  const meetsCriteria = 
    !hasConflicts && 
    apiWorking && 
    dbWorking && 
    uiComplete && 
    depsWorking && 
    !hasConflictingUI &&
    isTested;
  
  if (meetsCriteria) {
    cleanPRs.push({
      prNumber,
      title: lines[0]?.split('—')[1]?.trim() || `PR #${prNumber}`,
      status,
      api: apiStatus,
      db: dbStatus,
      ui: uiStatus,
      deps: depsStatus,
      tested: isTested,
      conflicts: hasConflicts,
      conflictingUI: hasConflictingUI
    });
  }
  
  // Log analysis
  console.log(`PR #${prNumber}:`);
  console.log(`  Title: ${lines[0]?.split('—')[1]?.trim() || 'N/A'}`);
  console.log(`  Status: ${status.substring(0, 50)}...`);
  console.log(`  Conflicts: ${hasConflicts ? '❌ YES' : '✅ NO'}`);
  console.log(`  API working: ${apiWorking ? '✅ YES' : '❌ NO'} (${apiStatus})`);
  console.log(`  DB working: ${dbWorking ? '✅ YES' : '❌ NO'} (${dbStatus})`);
  console.log(`  UI complete: ${uiComplete ? '✅ YES' : '❌ NO'} (${uiStatus})`);
  console.log(`  Deps working: ${depsWorking ? '✅ YES' : '❌ NO'} (${depsStatus})`);
  console.log(`  Conflicting UI: ${hasConflictingUI ? '❌ YES' : '✅ NO'}`);
  console.log(`  Tested: ${isTested ? '✅ YES' : '❌ NO'}`);
  console.log(`  Meets criteria: ${meetsCriteria ? '✅ YES' : '❌ NO'}`);
  console.log('');
});

// Summary
console.log('📊 CLEAN PRs SUMMARY');
console.log('===================\n');

if (cleanPRs.length === 0) {
  console.log('❌ NO PRs meet all criteria');
  console.log('\n🔍 Closest candidates:');
  
  // Find PRs that are close but missing one criterion
  const closePRs = [];
  prNumbers.forEach(prNumber => {
    const prSection = prSections.find(section => section.startsWith(`${prNumber}`));
    if (!prSection) return;
    
    const lines = prSection.split('\n');
    const titleLine = lines.find(l => l.includes('**Status:**'));
    const status = titleLine ? titleLine.split('**Status:**')[1]?.trim() : '';
    const hasConflicts = status.includes('NOT mergeable') || status.includes('merge conflicts');
    
    if (!hasConflicts) {
      const apiLine = lines.find(l => l.includes('**API:**'));
      const apiStatus = apiLine ? apiLine.includes('✅') ? '✅' : apiLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
      const apiWorking = apiStatus === '✅' || apiStatus === '⚠️';
      
      const dbLine = lines.find(l => l.includes('**Database:**'));
      const dbStatus = dbLine ? dbLine.includes('✅') ? '✅' : dbLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
      const dbWorking = dbStatus === '✅' || dbStatus === '⚠️';
      
      const depsLine = lines.find(l => l.includes('**Dependencies:**'));
      const depsStatus = depsLine ? depsLine.includes('✅') ? '✅' : depsLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
      const depsWorking = depsStatus === '✅';
      
      const isTested = lines.some(l => l.includes('tests') || l.includes('Vercel deploys'));
      
      if (apiWorking && dbWorking && depsWorking && isTested) {
        const uiLine = lines.find(l => l.includes('**UI Spec:**'));
        const uiStatus = uiLine ? uiLine.includes('✅') ? '✅' : uiLine.includes('⚠️') ? '⚠️' : '❌' : '❓';
        const uiComplete = uiStatus === '✅' || uiStatus === '⚠️';
        
        closePRs.push({
          prNumber,
          title: lines[0]?.split('—')[1]?.trim() || `PR #${prNumber}`,
          missing: !uiComplete ? 'UI component' : 'Other',
          api: apiStatus,
          db: dbStatus,
          ui: uiStatus,
          deps: depsStatus
        });
      }
    }
  });
  
  if (closePRs.length > 0) {
    closePRs.forEach(pr => {
      console.log(`  PR #${pr.prNumber}: ${pr.title}`);
      console.log(`    Missing: ${pr.missing}`);
      console.log(`    API: ${pr.api}, DB: ${pr.db}, UI: ${pr.ui}, Deps: ${pr.deps}`);
      console.log('');
    });
  }
} else {
  console.log(`✅ Found ${cleanPRs.length} PRs that meet all criteria:\n`);
  
  cleanPRs.forEach(pr => {
    console.log(`  🔹 PR #${pr.prNumber}: ${pr.title}`);
    console.log(`     Status: ${pr.status.substring(0, 40)}...`);
    console.log(`     API: ${pr.api}, DB: ${pr.db}, UI: ${pr.ui}, Deps: ${pr.deps}`);
    console.log(`     Tested: ✅, Conflicts: ❌, Conflicting UI: ❌`);
    console.log('');
  });
  
  console.log('🎯 RECOMMENDED MERGE ORDER:');
  console.log('--------------------------');
  cleanPRs.forEach((pr, index) => {
    console.log(`  ${index + 1}. PR #${pr.prNumber} - ${pr.title}`);
  });
}

console.log('\n📋 CRITERIA APPLIED:');
console.log('------------------');
console.log('1. ✅ No merge conflicts');
console.log('2. ✅ API working (✅ or ⚠️ but functional)');
console.log('3. ✅ Database working (✅ or ⚠️ but functional)');
console.log('4. ✅ Dependencies functional');
console.log('5. ✅ No conflicting UI screens');
console.log('6. ✅ Tested (tests pass, builds work)');
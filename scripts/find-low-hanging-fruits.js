/**
 * Find low hanging fruits - quick wins
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FINDING LOW HANGING FRUITS');
console.log('=============================\n');

const quickWins = [];

// 1. Check for obvious bugs in existing code
console.log('1. CHECKING FOR OBVIOUS BUGS');
console.log('---------------------------\n');

// Check for console.log statements in production code
const productionFiles = getAllFiles('src')
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  .filter(f => !f.includes('test') && !f.includes('spec'));

let consoleLogCount = 0;
productionFiles.slice(0, 20).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('console.log(') || content.includes('console.error(')) {
      consoleLogCount++;
      if (consoleLogCount <= 5) {
        console.log(`   ⚠️  ${path.relative('src', file)} has console statements`);
      }
    }
  } catch (error) {
    // Skip unreadable files
  }
});

if (consoleLogCount > 0) {
  quickWins.push({
    name: 'Remove console.log statements',
    description: `${consoleLogCount} files have console.log in production code`,
    effort: 'LOW',
    value: 'Cleaner logs, better performance',
    risk: 'NONE'
  });
}

// 2. Check for missing error handling
console.log('\n2. CHECKING FOR MISSING ERROR HANDLING');
console.log('--------------------------------------\n');

// Look for try/catch patterns
let missingErrorHandling = 0;
productionFiles.slice(0, 15).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Simple check for API calls without error handling
    lines.forEach((line, index) => {
      if (line.includes('fetch(') || line.includes('.then(') || line.includes('await ')) {
        // Check if there's error handling nearby
        const hasTryCatch = content.substring(0, index).includes('try {');
        const hasCatch = content.substring(index).includes('catch');
        
        if (!hasTryCatch || !hasCatch) {
          missingErrorHandling++;
        }
      }
    });
  } catch (error) {
    // Skip
  }
});

if (missingErrorHandling > 0) {
  quickWins.push({
    name: 'Add basic error handling',
    description: `${missingErrorHandling} potential missing error handlers`,
    effort: 'MEDIUM',
    value: 'Better reliability, fewer crashes',
    risk: 'LOW'
  });
}

// 3. Check for performance issues
console.log('\n3. CHECKING FOR PERFORMANCE ISSUES');
console.log('----------------------------------\n');

// Look for common React performance issues
let performanceIssues = 0;
const reactFiles = productionFiles.filter(f => f.endsWith('.tsx'));

reactFiles.slice(0, 10).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for missing React.memo or useMemo/useCallback
    if (content.includes('function Component') || content.includes('const Component')) {
      if (!content.includes('React.memo') && !content.includes('useMemo') && !content.includes('useCallback')) {
        performanceIssues++;
      }
    }
  } catch (error) {
    // Skip
  }
});

if (performanceIssues > 0) {
  quickWins.push({
    name: 'Add React performance optimizations',
    description: `${performanceIssues} components could use memoization`,
    effort: 'MEDIUM',
    value: 'Better UI performance',
    risk: 'LOW'
  });
}

// 4. Check for UI/UX improvements
console.log('\n4. CHECKING FOR UI/UX IMPROVEMENTS');
console.log('----------------------------------\n');

// Look for loading states
let missingLoadingStates = 0;
reactFiles.slice(0, 10).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for data fetching without loading states
    if (content.includes('useState') && content.includes('useEffect')) {
      if (!content.includes('loading') && !content.includes('Loading') && !content.includes('isLoading')) {
        missingLoadingStates++;
      }
    }
  } catch (error) {
    // Skip
  }
});

if (missingLoadingStates > 0) {
  quickWins.push({
    name: 'Add loading states',
    description: `${missingLoadingStates} components need loading indicators`,
    effort: 'LOW',
    value: 'Better user experience',
    risk: 'NONE'
  });
}

// 5. Check for security improvements
console.log('\n5. CHECKING FOR SECURITY IMPROVEMENTS');
console.log('-------------------------------------');

// Look for hardcoded secrets or API keys
let potentialSecurityIssues = 0;
const allFiles = getAllFiles('.')
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'));

allFiles.slice(0, 15).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Simple check for hardcoded secrets
    if (content.includes('api_key') || content.includes('API_KEY') || 
        content.includes('secret') || content.includes('SECRET') ||
        content.includes('password') || content.includes('PASSWORD')) {
      // Check if it's in a comment or string
      if (!content.includes('//') && !content.includes('/*')) {
        potentialSecurityIssues++;
      }
    }
  } catch (error) {
    // Skip
  }
});

if (potentialSecurityIssues > 0) {
  quickWins.push({
    name: 'Review hardcoded values',
    description: `${potentialSecurityIssues} files with potential hardcoded secrets`,
    effort: 'MEDIUM',
    value: 'Better security',
    risk: 'LOW'
  });
}

// 6. Check documentation
console.log('\n6. CHECKING DOCUMENTATION');
console.log('------------------------');

// Check for missing README or documentation
const docs = [
  'README.md',
  'CONTRIBUTING.md',
  'API.md',
  'DEPLOYMENT.md'
];

const missingDocs = docs.filter(doc => !fs.existsSync(doc));

if (missingDocs.length > 0) {
  quickWins.push({
    name: 'Add missing documentation',
    description: `Missing: ${missingDocs.join(', ')}`,
    effort: 'MEDIUM',
    value: 'Better onboarding and maintenance',
    risk: 'NONE'
  });
}

// Summary
console.log('\n📊 LOW HANGING FRUITS FOUND');
console.log('===========================\n');

if (quickWins.length === 0) {
  console.log('✅ No obvious low hanging fruits found');
  console.log('Codebase appears to be in good shape');
} else {
  console.log(`Found ${quickWins.length} potential quick wins:\n`);
  
  // Sort by effort (LOW first)
  quickWins.sort((a, b) => {
    const effortOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    return effortOrder[a.effort] - effortOrder[b.effort];
  });
  
  quickWins.forEach((win, index) => {
    console.log(`${index + 1}. ${win.name}`);
    console.log(`   📝 ${win.description}`);
    console.log(`   ⚡ Effort: ${win.effort}`);
    console.log(`   💎 Value: ${win.value}`);
    console.log(`   ⚠️  Risk: ${win.risk}`);
    console.log('');
  });
}

// Also check for specific issues mentioned in PR readiness report
console.log('7. CHECKING PR READINESS REPORT FOR QUICK FIXES');
console.log('-----------------------------------------------\n');

const reportPath = 'PR_READINESS_REPORT.md';
if (fs.existsSync(reportPath)) {
  try {
    const report = fs.readFileSync(reportPath, 'utf8');
    
    // Look for "needs work" or "missing" items that are quick fixes
    const quickFixPatterns = [
      /missing (UI|dashboard)/i,
      /needs (monetisation|pricing)/i,
      /documentation (only|missing)/i,
      /WIP/i,
      /(\d+)\/(\d+) checklist items done/i
    ];
    
    const lines = report.split('\n');
    let foundQuickFixes = 0;
    
    lines.forEach(line => {
      quickFixPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          console.log(`   ⚡ ${line.trim().substring(0, 80)}...`);
          foundQuickFixes++;
        }
      });
    });
    
    if (foundQuickFixes > 0) {
      console.log(`\n   Found ${foundQuickFixes} potential quick fixes in PR report`);
    }
  } catch (error) {
    console.log(`   Could not read PR report: ${error.message}`);
  }
}

console.log('\n🎯 RECOMMENDED QUICK WINS (Highest ROI):');
console.log('---------------------------------------\n');

// Recommend the best quick wins
const recommendedWins = quickWins
  .filter(win => win.effort === 'LOW' && win.risk === 'NONE')
  .slice(0, 3);

if (recommendedWins.length > 0) {
  recommendedWins.forEach((win, index) => {
    console.log(`${index + 1}. ${win.name}`);
    console.log(`   Why: ${win.description}`);
    console.log(`   Impact: ${win.value}`);
    console.log('');
  });
  
  console.log('🚀 These can be implemented immediately with minimal risk');
} else {
  console.log('No LOW effort, NO risk quick wins found.');
  console.log('Consider medium effort items with high value.');
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
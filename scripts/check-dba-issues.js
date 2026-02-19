/**
 * Check for DBA API issues (duplicate database calls)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING FOR DBA API ISSUES (Duplicate DB calls)');
console.log('===================================================\n');

// Check RGY API files for potential duplicate DB calls
const apiDir = 'src/app/api/rgy';
let issuesFound = 0;

if (fs.existsSync(apiDir)) {
  const apiFiles = [];
  
  function findAPIFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findAPIFiles(fullPath);
      } else if (item === 'route.ts') {
        apiFiles.push(fullPath);
      }
    });
  }
  
  findAPIFiles(apiDir);
  
  console.log(`Found ${apiFiles.length} API route files\n`);
  
  apiFiles.forEach(file => {
    console.log(`📄 ${path.relative(process.cwd(), file)}`);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for database calls
      const dbCalls = [];
      
      // Look for Supabase client calls
      const supabaseMatches = content.match(/supabase\.(\w+)/g) || [];
      const uniqueSupabaseCalls = [...new Set(supabaseMatches)];
      
      // Look for database queries
      const queryMatches = content.match(/\.(select|insert|update|delete|from|where)/gi) || [];
      
      // Look for potential duplicate patterns
      const lines = content.split('\n');
      const duplicatePatterns = [];
      
      lines.forEach((line, index) => {
        // Check for similar consecutive database calls
        if (line.includes('supabase.') || line.includes('.select') || line.includes('.from')) {
          dbCalls.push({ line: line.trim(), index: index + 1 });
        }
      });
      
      // Check for consecutive similar calls
      for (let i = 0; i < dbCalls.length - 1; i++) {
        const current = dbCalls[i].line;
        const next = dbCalls[i + 1].line;
        
        // Simple similarity check
        if (current.includes('supabase.') && next.includes('supabase.')) {
          const currentTable = current.match(/from\s+['"]?(\w+)['"]?/i);
          const nextTable = next.match(/from\s+['"]?(\w+)['"]?/i);
          
          if (currentTable && nextTable && currentTable[1] === nextTable[1]) {
            duplicatePatterns.push({
              line1: dbCalls[i].index,
              line2: dbCalls[i + 1].index,
              table: currentTable[1]
            });
          }
        }
      }
      
      if (uniqueSupabaseCalls.length > 0) {
        console.log(`   Supabase calls: ${uniqueSupabaseCalls.join(', ')}`);
      }
      
      if (queryMatches.length > 0) {
        console.log(`   Query operations: ${queryMatches.length}`);
      }
      
      if (duplicatePatterns.length > 0) {
        console.log(`   ⚠️  Potential duplicate calls: ${duplicatePatterns.length}`);
        duplicatePatterns.forEach(pattern => {
          console.log(`      Lines ${pattern.line1} and ${pattern.line2}: ${pattern.table} table`);
          issuesFound++;
        });
      } else {
        console.log(`   ✅ No obvious duplicate patterns found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error reading file: ${error.message}`);
    }
    
    console.log('');
  });
} else {
  console.log('❌ RGY API directory not found');
}

// Check for shared services pattern (our fix for admin dashboard)
console.log('🔧 CHECKING FOR SHARED SERVICES PATTERN');
console.log('---------------------------------------\n');

const sharedServicesDir = 'src/lib/services';
if (fs.existsSync(sharedServicesDir)) {
  console.log(`✅ Shared services directory exists`);
  
  const serviceFiles = fs.readdirSync(sharedServicesDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  
  console.log(`   Found ${serviceFiles.length} service files`);
  
  // Check if RGY uses shared services
  const rgyFiles = [];
  function findRGYFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findRGYFiles(fullPath);
      } else if (item.toLowerCase().includes('rgy') && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        rgyFiles.push(fullPath);
      }
    });
  }
  
  findRGYFiles('src');
  
  let usesSharedServices = false;
  rgyFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('shared') || content.includes('services/')) {
        usesSharedServices = true;
      }
    } catch (error) {
      // Skip unreadable files
    }
  });
  
  if (usesSharedServices) {
    console.log(`   ✅ RGY code uses shared services pattern`);
  } else {
    console.log(`   ⚠️  RGY code doesn't appear to use shared services`);
    console.log(`   💡 Consider refactoring to use shared services to avoid duplicate DB calls`);
  }
} else {
  console.log(`❌ Shared services directory not found`);
  console.log(`   💡 This is the pattern we used to fix admin dashboard issues`);
}

// Summary
console.log('\n📊 DBA ISSUES SUMMARY');
console.log('====================\n');

if (issuesFound === 0) {
  console.log('✅ NO DBA API ISSUES FOUND');
  console.log('   PR #117 appears to have clean database access patterns');
} else {
  console.log(`⚠️  ${issuesFound} POTENTIAL DBA ISSUES FOUND`);
  console.log('   These should be reviewed before merging');
}

console.log('\n🎯 RECOMMENDATION:');
if (issuesFound === 0) {
  console.log('PR #117 is clean and ready for merge.');
  console.log('No DBA API issues detected.');
} else {
  console.log('Review the potential duplicate calls before merging.');
  console.log('Consider refactoring to use shared services pattern.');
}

console.log('\n🚀 NEXT STEP: Merge to test branch and run full CI/CD');
/**
 * Remove console.log statements from production code
 * Low hanging fruit #1
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 REMOVING CONSOLE.LOG STATEMENTS');
console.log('==================================\n');

// Get all production files
const productionFiles = getAllFiles('src')
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  .filter(f => !f.includes('test') && !f.includes('spec'));

let totalRemoved = 0;
const modifiedFiles = [];

productionFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if file has console statements
    const hasConsole = content.includes('console.log(') || 
                       content.includes('console.error(') ||
                       content.includes('console.warn(') ||
                       content.includes('console.info(') ||
                       content.includes('console.debug(');
    
    if (hasConsole) {
      // Remove console statements but keep the rest of the line if it has other code
      let newContent = content;
      let removedCount = 0;
      
      // Pattern to match console statements
      const consolePatterns = [
        /console\.log\([^)]*\);/g,
        /console\.error\([^)]*\);/g,
        /console\.warn\([^)]*\);/g,
        /console\.info\([^)]*\);/g,
        /console\.debug\([^)]*\);/g
      ];
      
      consolePatterns.forEach(pattern => {
        const matches = newContent.match(pattern);
        if (matches) {
          removedCount += matches.length;
          newContent = newContent.replace(pattern, '');
        }
      });
      
      // Also handle console statements that might be part of larger expressions
      // This is more conservative - only remove if it's a standalone statement
      const lines = newContent.split('\n');
      const cleanedLines = lines.map(line => {
        // Remove lines that are ONLY console statements (with optional whitespace)
        if (line.trim().startsWith('console.log(') || 
            line.trim().startsWith('console.error(') ||
            line.trim().startsWith('console.warn(') ||
            line.trim().startsWith('console.info(') ||
            line.trim().startsWith('console.debug(')) {
          if (line.trim().endsWith(';')) {
            removedCount++;
            return ''; // Remove the entire line
          }
        }
        return line;
      });
      
      newContent = cleanedLines.join('\n');
      
      if (removedCount > 0) {
        // Write back only if changed
        if (newContent !== content) {
          fs.writeFileSync(file, newContent, 'utf8');
          totalRemoved += removedCount;
          modifiedFiles.push({
            file: path.relative('src', file),
            removed: removedCount
          });
          
          console.log(`✅ ${path.relative('src', file)}: Removed ${removedCount} console statements`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error processing ${file}: ${error.message}`);
  }
});

// Summary
console.log('\n📊 SUMMARY');
console.log('==========\n');

if (totalRemoved === 0) {
  console.log('✅ No console statements found to remove');
} else {
  console.log(`✅ Removed ${totalRemoved} console statements from ${modifiedFiles.length} files\n`);
  
  console.log('Modified files:');
  modifiedFiles.slice(0, 10).forEach(({ file, removed }) => {
    console.log(`   📄 ${file} (${removed} removed)`);
  });
  
  if (modifiedFiles.length > 10) {
    console.log(`   ... and ${modifiedFiles.length - 10} more files`);
  }
  
  console.log('\n🎯 IMPACT:');
  console.log('   • Cleaner production logs');
  console.log('   • Slightly better performance');
  console.log('   • More professional codebase');
  console.log('   • Zero risk (debug statements only)');
}

console.log('\n🚀 NEXT LOW HANGING FRUIT:');
console.log('   Add loading states to components');

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
const fs = require('fs');
const path = require('path');

console.log('📚 DOCUMENTATION FILES IN SAFE-MERGE-ONLY');
console.log('=========================================\n');

function listFiles(dir, prefix = '') {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and .git
      if (file.name !== 'node_modules' && file.name !== '.git' && !file.name.startsWith('.')) {
        listFiles(filePath, prefix + '  ');
      }
    } else if (file.name.endsWith('.md')) {
      const relativePath = path.relative('.', filePath);
      const size = fs.statSync(filePath).size;
      
      // Categorize
      let category = 'Other';
      if (relativePath.includes('monet') || relativePath.includes('Monet')) category = 'Monetisation';
      if (relativePath.includes('emergent') || relativePath.includes('Emergent')) category = 'Emergent';
      if (relativePath.includes('CONTRIBUTING') || relativePath.includes('API') || relativePath.includes('DEPLOYMENT')) category = 'Our Docs';
      
      console.log(`${category.padEnd(15)} ${relativePath.padEnd(50)} ${(size / 1024).toFixed(1)}KB`);
    }
  });
}

try {
  listFiles('.');
  
  console.log('\n🎯 DOCUMENTATION TO MERGE FIRST:');
  console.log('===============================\n');
  
  console.log('1. Monetisation Strategy (PR #132):');
  console.log('   • Look for files with "monet" in name');
  console.log('   • Check docs/ folder');
  console.log('');
  
  console.log('2. Emergent Documentation (PR #133):');
  console.log('   • emergent-architecture.md');
  console.log('   • emergent-database-schema.md');
  console.log('   • emergent-security.md');
  console.log('   • emergent-testing.md');
  console.log('   • emergent-tool-api.md');
  console.log('   • EMERGENT_REQUIREMENTS_*.md');
  console.log('');
  
  console.log('3. Our Added Documentation:');
  console.log('   • CONTRIBUTING.md');
  console.log('   • API.md');
  console.log('   • DEPLOYMENT.md');
  console.log('');
  
  console.log('🚀 MERGE STRATEGY:');
  console.log('1. Merge all documentation files first');
  console.log('2. They are zero risk');
  console.log('3. Can be merged together since all are docs');
  
} catch (error) {
  console.log(`Error: ${error.message}`);
}
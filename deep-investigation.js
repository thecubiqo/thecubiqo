// Deep investigation of cubiqo.ai production issues
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 DEEP INVESTIGATION: CUBIQO.AI PRODUCTION ISSUES');
console.log('===================================================\n');
console.log('Time:', new Date().toLocaleString());
console.log('');

const urls = [
  'https://www.cubiqo.ai',
  'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app',
  'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app'
];

async function deepInvestigate() {
  console.log('🚀 STARTING DEEP INVESTIGATION\n');
  
  for (const url of urls) {
    console.log(`🔍 ANALYZING: ${url}`);
    console.log('='.repeat(50));
    
    try {
      const result = await fetchWithTimeout(url, 15000);
      console.log(`Status: ${result.status}`);
      console.log(`Content-Type: ${result.headers['content-type']}`);
      console.log(`Server: ${result.headers['server'] || 'Unknown'}`);
      console.log(`Size: ${result.data.length} bytes\n`);
      
      const html = result.data.toString();
      
      // Save HTML for analysis
      const filename = url.replace(/[^a-z0-9]/gi, '_') + '.html';
      fs.writeFileSync(path.join(__dirname, filename), html);
      console.log(`📁 HTML saved to: ${filename}`);
      
      // Analyze HTML structure
      console.log('\n📊 HTML ANALYSIS:');
      
      // Check for Next.js specific patterns
      const nextPatterns = [
        { pattern: '__next', name: 'Next.js framework' },
        { pattern: 'next/script', name: 'Next.js scripts' },
        { pattern: 'next/link', name: 'Next.js links' },
        { pattern: 'next/image', name: 'Next.js images' },
        { pattern: 'next/head', name: 'Next.js head' }
      ];
      
      nextPatterns.forEach(({ pattern, name }) => {
        const count = (html.match(new RegExp(pattern, 'gi')) || []).length;
        console.log(`   ${name}: ${count > 0 ? `✅ ${count}` : '❌ 0'}`);
      });
      
      // Check for React hydration
      console.log('\n⚛️ REACT HYDRATION ANALYSIS:');
      
      const hydrationMarkers = [
        { pattern: '<!-- -->', name: 'React comment markers' },
        { pattern: 'data-reactroot', name: 'React root' },
        { pattern: 'react-', name: 'React attributes' },
        { pattern: 'hydration', name: 'Hydration references' }
      ];
      
      hydrationMarkers.forEach(({ pattern, name }) => {
        const count = (html.match(new RegExp(pattern, 'gi')) || []).length;
        console.log(`   ${name}: ${count > 0 ? `✅ ${count}` : '❌ 0'}`);
      });
      
      // Check for error patterns
      console.log('\n🚨 ERROR PATTERN ANALYSIS:');
      
      const errorPatterns = [
        { pattern: '404', name: '404 errors' },
        { pattern: 'not found', name: 'Not found text' },
        { pattern: 'error', name: 'Error text' },
        { pattern: 'undefined', name: 'Undefined values' },
        { pattern: '\\$undefined', name: '$undefined props' },
        { pattern: 'parallelRouterKey', name: 'Parallel router errors' }
      ];
      
      errorPatterns.forEach(({ pattern, name }) => {
        const count = (html.match(new RegExp(pattern, 'gi')) || []).length;
        if (count > 0) {
          console.log(`   ${name}: ❌ ${count} occurrences`);
          
          // Show context for first occurrence
          const regex = new RegExp(pattern, 'i');
          const match = html.match(regex);
          if (match) {
            const index = html.indexOf(match[0]);
            const start = Math.max(0, index - 100);
            const end = Math.min(html.length, index + match[0].length + 100);
            console.log(`     Context: ...${html.substring(start, end).replace(/\n/g, ' ')}...`);
          }
        } else {
          console.log(`   ${name}: ✅ 0`);
        }
      });
      
      // Check for EnergyCube/Three.js
      console.log('\n🎨 ENERGYCUBE ANALYSIS:');
      
      const cubePatterns = [
        { pattern: '<canvas', name: 'Canvas elements' },
        { pattern: 'three', name: 'Three.js references' },
        { pattern: 'webgl', name: 'WebGL references' },
        { pattern: 'EnergyCube', name: 'EnergyCube references' }
      ];
      
      cubePatterns.forEach(({ pattern, name }) => {
        const count = (html.match(new RegExp(pattern, 'gi')) || []).length;
        console.log(`   ${name}: ${count > 0 ? `✅ ${count}` : '❌ 0'}`);
      });
      
      // Check for proper app structure
      console.log('\n🏗️ APP STRUCTURE ANALYSIS:');
      
      const structurePatterns = [
        { pattern: '<!DOCTYPE', name: 'DOCTYPE' },
        { pattern: '<html', name: 'HTML tag' },
        { pattern: '<head', name: 'Head tag' },
        { pattern: '<body', name: 'Body tag' },
        { pattern: '<main', name: 'Main content' },
        { pattern: '<div id="__next"', name: 'Next.js root div' }
      ];
      
      structurePatterns.forEach(({ pattern, name }) => {
        const exists = html.includes(pattern);
        console.log(`   ${name}: ${exists ? '✅' : '❌'}`);
      });
      
      // Check for script loading
      const scriptCount = (html.match(/<script/gi) || []).length;
      console.log(`   Script tags: ${scriptCount}`);
      
      // Check for CSS
      const linkCount = (html.match(/<link/gi) || []).length;
      console.log(`   Link tags: ${linkCount}`);
      
      console.log('\n📈 DIAGNOSIS:');
      
      // Determine issue type
      const has404 = html.includes('404') || html.includes('not found');
      const hasUndefinedProps = html.includes('$undefined');
      const hasParallelRouter = html.includes('parallelRouterKey');
      const hasNextRoot = html.includes('id="__next"');
      
      if (has404 && hasUndefinedProps && hasParallelRouter) {
        console.log('🚨 ISSUE: Next.js App Router Configuration Error');
        console.log('   • Parallel router errors detected');
        console.log('   • $undefined props in component tree');
        console.log('   • 404 content showing');
        console.log('\n🔧 LIKELY FIXES:');
        console.log('1. Check app/layout.tsx and app/page.tsx structure');
        console.log('2. Verify middleware.ts routing logic');
        console.log('3. Check for missing route segments');
        console.log('4. Verify Next.js version compatibility');
      } else if (!hasNextRoot) {
        console.log('🚨 ISSUE: Next.js Not Loading');
        console.log('   • Missing __next root div');
        console.log('   • Next.js framework not detected');
        console.log('\n🔧 LIKELY FIXES:');
        console.log('1. Check Next.js build process');
        console.log('2. Verify package.json dependencies');
        console.log('3. Check for build errors in Vercel');
      } else {
        console.log('⚠️  ISSUE: Mixed Configuration');
        console.log('   • Some Next.js elements present');
        console.log('   • But routing/hydration errors exist');
        console.log('\n🔧 LIKELY FIXES:');
        console.log('1. Clear Vercel deployment cache');
        console.log('2. Rebuild from scratch');
        console.log('3. Check environment variables');
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
      
    } catch (error) {
      console.log(`❌ Error analyzing ${url}: ${error.message}\n`);
    }
  }
  
  // Check local configuration
  console.log('🔧 CHECKING LOCAL CONFIGURATION:\n');
  
  const configFiles = [
    'next.config.js',
    'package.json',
    'tsconfig.json',
    'vercel.json',
    'src/app/layout.tsx',
    'src/app/page.tsx'
  ];
  
  configFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    
    if (exists && (file === 'next.config.js' || file === 'package.json')) {
      try {
        const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
        if (file === 'next.config.js') {
          const hasDirConfig = content.includes('dir:');
          console.log(`   ${hasDirConfig ? '✅' : '❌'} Has dir configuration`);
        }
        if (file === 'package.json') {
          const pkg = JSON.parse(content);
          console.log(`   Next.js: ${pkg.dependencies?.next || pkg.devDependencies?.next || '❌ Not found'}`);
          console.log(`   React: ${pkg.dependencies?.react || pkg.devDependencies?.react || '❌ Not found'}`);
        }
      } catch (e) {
        console.log(`   ❌ Error reading: ${e.message}`);
      }
    }
  });
  
  console.log('\n🎯 RECOMMENDED ACTIONS:');
  console.log('1. Check Vercel build logs for specific errors');
  console.log('2. Clear Vercel deployment cache');
  console.log('3. Try building locally: npm run build');
  console.log('4. Check for conflicting configuration files');
  console.log('5. Verify all App Router files exist in src/app/');
  
  console.log('\n🔗 VERCEL DASHBOARD:');
  console.log('https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  console.log('\n🔗 GITHUB ACTIONS:');
  console.log('https://github.com/thecubiqo/thecubiqo/actions');
}

function fetchWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeout}ms`));
    });
  });
}

deepInvestigate().catch(console.error);
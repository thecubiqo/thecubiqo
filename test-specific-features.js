// Test specific features on PR deployment
const https = require('https');

console.log('🎯 TESTING SPECIFIC FEATURES ON PR DEPLOYMENT');
console.log('========================================\n');

const baseUrl = 'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app';

// Features to test
const featuresToTest = [
  {
    name: 'FoundersPass Login',
    path: '/founderspass',
    test: (html) => {
      const checks = [];
      const lowerHtml = html.toLowerCase();
      
      if (lowerHtml.includes('pin') || lowerHtml.includes('founder')) {
        checks.push('✅ FoundersPass login page detected');
      }
      
      if (lowerHtml.includes('2026')) {
        checks.push('✅ PIN field/instructions present');
      }
      
      if (lowerHtml.includes('login') || lowerHtml.includes('submit')) {
        checks.push('✅ Login form elements present');
      }
      
      return checks;
    }
  },
  {
    name: 'EnergyCube/WebGL Detection',
    path: '/',
    test: (html) => {
      const checks = [];
      const lowerHtml = html.toLowerCase();
      
      // Check for WebGL/Three.js indicators
      const webglIndicators = [
        'three.js', 'webgl', 'canvas', 'gl-', 'shader',
        'energycube', 'plasmawave', 'ribbon', 'morph'
      ];
      
      webglIndicators.forEach(indicator => {
        if (lowerHtml.includes(indicator)) {
          checks.push(`✅ ${indicator} detected`);
        }
      });
      
      // Check for 3D/visual elements
      if (lowerHtml.includes('scene') || lowerHtml.includes('camera') || lowerHtml.includes('render')) {
        checks.push('✅ 3D scene elements detected');
      }
      
      if (checks.length === 0) {
        checks.push('⚠️ No obvious WebGL/EnergyCube indicators found in HTML');
        checks.push('💡 Note: EnergyCube might be loaded via JavaScript');
      }
      
      return checks;
    }
  },
  {
    name: 'UI Structure (Cuboid)',
    path: '/',
    test: (html) => {
      const checks = [];
      const lowerHtml = html.toLowerCase();
      
      // Check for UI structure indicators
      if (lowerHtml.includes('cuboid') || lowerHtml.includes('cube') || lowerHtml.includes('structure')) {
        checks.push('✅ Cuboid/structure references found');
      }
      
      // Check for orange design elements
      if (lowerHtml.includes('orange') || lowerHtml.includes('amber') || lowerHtml.includes('yellow')) {
        checks.push('✅ Orange/amber color scheme detected');
      }
      
      // Check for modern UI elements
      if (lowerHtml.includes('gradient') || lowerHtml.includes('shadow') || lowerHtml.includes('rounded')) {
        checks.push('✅ Modern UI styling detected');
      }
      
      return checks;
    }
  },
  {
    name: 'Content Publishing (cpsite)',
    path: '/',
    test: (html) => {
      const checks = [];
      const lowerHtml = html.toLowerCase();
      
      // Check for content/publishing indicators
      if (lowerHtml.includes('content') || lowerHtml.includes('publish') || lowerHtml.includes('cpsite')) {
        checks.push('✅ Content publishing references found');
      }
      
      // Check for admin/editor features
      if (lowerHtml.includes('admin') || lowerHtml.includes('editor') || lowerHtml.includes('dashboard')) {
        checks.push('✅ Admin/editor features detected');
      }
      
      return checks;
    }
  },
  {
    name: 'Feature Toggle API',
    path: '/api/founderspass/catalog',
    test: (html, status) => {
      const checks = [];
      
      if (status === 200) {
        try {
          const data = JSON.parse(html);
          checks.push(`✅ API responded with data`);
          
          if (data.features || data.length > 0) {
            checks.push(`✅ Features catalog returned (${data.features ? data.features.length : data.length} items)`);
          }
        } catch (e) {
          checks.push(`⚠️ API returned non-JSON: ${html.substring(0, 100)}...`);
        }
      } else if (status === 404) {
        checks.push('⚠️ API endpoint not found (may be client-side routing)');
      } else {
        checks.push(`⚠️ API returned status: ${status}`);
      }
      
      return checks;
    }
  }
];

async function fetchUrl(url) {
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testFeature(feature) {
  const url = `${baseUrl}${feature.path}`;
  console.log(`🔍 Testing: ${feature.name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await fetchUrl(url);
    console.log(`   📊 Status: ${result.status}`);
    
    // Run feature-specific tests
    const checks = feature.test(result.data, result.status);
    
    if (checks.length > 0) {
      checks.forEach(check => console.log(`   ${check}`));
    }
    
    // Additional diagnostics
    if (result.status === 200) {
      console.log(`   📏 Size: ${result.data.length} bytes`);
      
      // Check if it's a Next.js page
      if (result.data.includes('__next') || result.data.includes('next')) {
        console.log(`   ⚛️  Next.js page detected`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🚀 PR DEPLOYMENT FEATURE TEST SUITE\n');
  console.log(`Base URL: ${baseUrl}\n`);
  
  // Test each feature
  for (const feature of featuresToTest) {
    await testFeature(feature);
  }
  
  console.log('========================================');
  console.log('🎯 FEATURE TEST SUMMARY');
  console.log('');
  console.log('✅ WHAT TO MANUALLY TEST:');
  console.log('');
  console.log('1. 🎨 ENERGYCUBE ANIMATIONS:');
  console.log('   • Visit the homepage');
  console.log('   • Look for 3D animations/morphing');
  console.log('   • Check if ribbons transform to cube');
  console.log('   • Verify orange soul design');
  console.log('');
  console.log('2. 🔧 FOUNDERSPASS BOARD:');
  console.log('   • Go to /founderspass');
  console.log('   • Enter PIN: 2026');
  console.log('   • Access dashboard');
  console.log('   • Test feature toggles');
  console.log('   • Verify changes persist');
  console.log('');
  console.log('3. 🏗️ UI CUBOID STRUCTURE:');
  console.log('   • Check layout structure');
  console.log('   • Verify orange design elements');
  console.log('   • Test responsive design');
  console.log('   • Check for any visual glitches');
  console.log('');
  console.log('4. 📝 CONTENT PUBLISHING (cpsite):');
  console.log('   • Look for content management features');
  console.log('   • Check for editor interfaces');
  console.log('   • Test publishing workflows');
  console.log('');
  console.log('🔗 DIRECT TEST LINKS:');
  console.log(`   • Home: ${baseUrl}`);
  console.log(`   • FoundersPass: ${baseUrl}/founderspass`);
  console.log(`   • Dashboard: ${baseUrl}/founderspass/dashboard`);
  console.log('');
  console.log('📊 TEST NOTES:');
  console.log('   • PR deployment is isolated (safe to test)');
  console.log('   • Production deployment still in progress');
  console.log('   • FoundersPass PIN: 2026');
  console.log('   • Feature toggles may affect UI');
}

runAllTests().catch(console.error);
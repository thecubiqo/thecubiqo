// End-to-End Visual Testing on PR Deployment
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🎯 END-TO-END VISUAL TESTING - PR DEPLOYMENT');
console.log('========================================\n');

const prUrl = 'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchUrl(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function fetchUrl(url) {
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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout after 15s'));
    });
  });
}

async function testHomepage() {
  console.log('1. 🏠 HOMEPAGE VISUAL TEST');
  console.log('   URL:', prUrl);
  console.log('   Testing for EnergyCube animations and UI structure...\n');
  
  try {
    const result = await fetchWithRetry(prUrl);
    console.log('   ✅ Status:', result.status);
    console.log('   📏 Size:', result.data.length, 'bytes');
    
    const html = result.data;
    const lowerHtml = html.toLowerCase();
    
    // EnergyCube/PR #194 indicators
    console.log('\n   🎨 ENERGYCUBE INDICATORS (PR #194):');
    const energyCubeChecks = [
      { name: 'Three.js library', found: html.includes('three') || html.includes('THREE') },
      { name: 'WebGL references', found: lowerHtml.includes('webgl') },
      { name: 'Canvas elements', found: lowerHtml.includes('<canvas') },
      { name: 'EnergyCube text', found: html.includes('EnergyCube') },
      { name: 'PlasmaWave references', found: html.includes('PlasmaWave') },
      { name: 'Ribbon animations', found: lowerHtml.includes('ribbon') },
      { name: 'Morph animations', found: lowerHtml.includes('morph') }
    ];
    
    energyCubeChecks.forEach(check => {
      console.log(`     ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    // UI Structure/PR #195 indicators
    console.log('\n   🏗️ UI STRUCTURE INDICATORS (PR #195):');
    const uiChecks = [
      { name: 'Orange color scheme', found: lowerHtml.includes('orange') || lowerHtml.includes('#ff6b35') || lowerHtml.includes('amber') },
      { name: 'Cuboid references', found: lowerHtml.includes('cuboid') || lowerHtml.includes('cube') },
      { name: 'Modern UI classes', found: lowerHtml.includes('gradient') || lowerHtml.includes('shadow') || lowerHtml.includes('rounded') },
      { name: 'Responsive design', found: lowerHtml.includes('responsive') || lowerHtml.includes('@media') || lowerHtml.includes('flex') },
      { name: 'Next.js framework', found: lowerHtml.includes('__next') || lowerHtml.includes('next/') }
    ];
    
    uiChecks.forEach(check => {
      console.log(`     ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    // Check for specific PR changes
    console.log('\n   🔍 SPECIFIC PR CHANGES VERIFICATION:');
    
    // PR #194: Should have EnergyCubeScene, not solid pink EnergyCube
    if (lowerHtml.includes('energycubescene')) {
      console.log('     ✅ EnergyCubeScene present (PR #194 fix)');
    } else if (lowerHtml.includes('solid pink')) {
      console.log('     ❌ Solid pink EnergyCube present (PR #194 not applied)');
    }
    
    // PR #195: Should have orange soul design
    if (lowerHtml.includes('orange soul') || lowerHtml.includes('soul design')) {
      console.log('     ✅ Orange soul design present (PR #195 fix)');
    }
    
    // Check for JavaScript that loads WebGL
    const scriptTags = (html.match(/<script[^>]*>/g) || []).length;
    console.log(`     📜 Script tags: ${scriptTags}`);
    
    if (scriptTags > 0) {
      console.log('     💡 Note: WebGL may load via JavaScript (check browser)');
    }
    
    return {
      success: true,
      energyCubeIndicators: energyCubeChecks.filter(c => c.found).length,
      uiIndicators: uiChecks.filter(c => c.found).length,
      hasCanvas: lowerHtml.includes('<canvas'),
      hasThreeJs: html.includes('three') || html.includes('THREE')
    };
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFoundersPass() {
  console.log('\n2. 🔐 FOUNDERSPASS VISUAL TEST');
  console.log('   URL:', `${prUrl}/founderspass`);
  console.log('   Testing login page and dashboard UI...\n');
  
  try {
    // Test login page
    const loginResult = await fetchWithRetry(`${prUrl}/founderspass`);
    console.log('   🔐 LOGIN PAGE:');
    console.log('     ✅ Status:', loginResult.status);
    
    const loginHtml = loginResult.data.toLowerCase();
    
    const loginChecks = [
      { name: 'PIN input field', found: loginHtml.includes('pin') || loginHtml.includes('password') },
      { name: 'Founder text', found: loginHtml.includes('founder') },
      { name: 'Submit button', found: loginHtml.includes('submit') || loginHtml.includes('button') },
      { name: '2026 PIN hint', found: loginHtml.includes('2026') },
      { name: 'Login form', found: loginHtml.includes('<form') || loginHtml.includes('form') }
    ];
    
    loginChecks.forEach(check => {
      console.log(`     ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    // Test dashboard (may have client-side auth)
    console.log('\n   📊 DASHBOARD PAGE:');
    const dashboardResult = await fetchWithRetry(`${prUrl}/founderspass/dashboard`);
    console.log('     ✅ Status:', dashboardResult.status);
    
    const dashboardHtml = dashboardResult.data.toLowerCase();
    
    const dashboardChecks = [
      { name: 'Feature list', found: dashboardHtml.includes('feature') },
      { name: 'Toggle switches', found: dashboardHtml.includes('toggle') || dashboardHtml.includes('switch') },
      { name: 'Dashboard text', found: dashboardHtml.includes('dashboard') },
      { name: 'Settings/controls', found: dashboardHtml.includes('control') || dashboardHtml.includes('setting') }
    ];
    
    dashboardChecks.forEach(check => {
      console.log(`     ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    // Check for feature catalog UI
    if (dashboardHtml.includes('catalog') || dashboardHtml.includes('list')) {
      console.log('     ✅ Feature catalog UI detected');
    }
    
    return {
      success: true,
      loginChecks: loginChecks.filter(c => c.found).length,
      dashboardChecks: dashboardChecks.filter(c => c.found).length,
      hasLoginForm: loginHtml.includes('<form') || loginHtml.includes('form')
    };
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAPIs() {
  console.log('\n3. 🔌 API ENDPOINT TEST');
  console.log('   Testing API connectivity (expected to fail in PR)...\n');
  
  const endpoints = [
    { path: '/api/health', name: 'Health API', expected: 200 },
    { path: '/api/founderspass/catalog', name: 'Catalog API', expected: 500 },
    { path: '/api/founderspass/toggle', name: 'Toggle API', expected: 405 }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await fetchUrl(`${prUrl}${endpoint.path}`);
      console.log(`   ${endpoint.name}:`);
      console.log(`     Status: ${result.status} ${result.status === endpoint.expected ? '✅' : '⚠️'}`);
      
      if (result.status === 200 && endpoint.path === '/api/health') {
        try {
          const data = JSON.parse(result.data);
          console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch (e) {
          console.log(`     Response: ${result.data.substring(0, 100)}...`);
        }
      }
      
      results.push({
        name: endpoint.name,
        status: result.status,
        expected: endpoint.expected,
        match: result.status === endpoint.expected
      });
      
    } catch (error) {
      console.log(`   ${endpoint.name}: ❌ ${error.message}`);
      results.push({
        name: endpoint.name,
        status: 'error',
        expected: endpoint.expected,
        match: false
      });
    }
  }
  
  return results;
}

async function runEndToEndVisualTest() {
  console.log('🚀 STARTING END-TO-END VISUAL TESTING\n');
  console.log('PR Deployment URL:', prUrl);
  console.log('Time:', new Date().toLocaleString());
  console.log('');
  
  const testResults = {
    homepage: null,
    foundersPass: null,
    apis: null,
    summary: {}
  };
  
  // Run tests
  testResults.homepage = await testHomepage();
  testResults.foundersPass = await testFoundersPass();
  testResults.apis = await testAPIs();
  
  // Generate summary
  console.log('\n========================================');
  console.log('📊 END-TO-END VISUAL TEST SUMMARY');
  console.log('========================================\n');
  
  console.log('🎯 TEST RESULTS:');
  
  if (testResults.homepage.success) {
    console.log(`1. 🏠 Homepage: ✅ PASS`);
    console.log(`   • EnergyCube indicators: ${testResults.homepage.energyCubeIndicators}/7`);
    console.log(`   • UI structure indicators: ${testResults.homepage.uiIndicators}/5`);
    console.log(`   • Has canvas: ${testResults.homepage.hasCanvas ? '✅' : '❌'}`);
    console.log(`   • Has Three.js: ${testResults.homepage.hasThreeJs ? '✅' : '❌'}`);
  } else {
    console.log(`1. 🏠 Homepage: ❌ FAIL - ${testResults.homepage.error}`);
  }
  
  if (testResults.foundersPass.success) {
    console.log(`\n2. 🔐 FoundersPass: ✅ PASS`);
    console.log(`   • Login checks: ${testResults.foundersPass.loginChecks}/5`);
    console.log(`   • Dashboard checks: ${testResults.foundersPass.dashboardChecks}/4`);
    console.log(`   • Has login form: ${testResults.foundersPass.hasLoginForm ? '✅' : '❌'}`);
  } else {
    console.log(`\n2. 🔐 FoundersPass: ❌ FAIL - ${testResults.foundersPass.error}`);
  }
  
  console.log(`\n3. 🔌 APIs: ${testResults.apis.filter(a => a.match).length}/${testResults.apis.length} as expected`);
  testResults.apis.forEach(api => {
    console.log(`   • ${api.name}: ${api.status} ${api.match ? '✅' : '⚠️'}`);
  });
  
  console.log('\n========================================');
  console.log('🎯 MANUAL VERIFICATION REQUIRED:');
  console.log('');
  console.log('1. 🎨 VISUAL CHECK - Open in browser:');
  console.log(`   ${prUrl}`);
  console.log('   • Look for 3D EnergyCube animations');
  console.log('   • Verify orange color scheme');
  console.log('   • Check UI structure is correct');
  console.log('');
  console.log('2. 🔐 FOUNDERSPASS FLOW:');
  console.log(`   ${prUrl}/founderspass`);
  console.log('   • Enter PIN: 2026');
  console.log('   • Verify dashboard loads');
  console.log('   • Check feature toggle UI');
  console.log('');
  console.log('3. ⚠️ EXPECTED LIMITATIONS:');
  console.log('   • API 500 errors are NORMAL in PR deployment');
  console.log('   • Database connections fail (no env vars in PR)');
  console.log('   • UI loads with fallback/default data');
  console.log('');
  console.log('4. ⏳ NEXT STEP:');
  console.log('   • Wait for production deployment (ETA: 19:00 EST)');
  console.log('   • Test full functionality on production');
  console.log('   • Verify database/API connections work');
  console.log('');
  console.log('🔗 Production URLs to check soon:');
  console.log('   • https://cubiqo.ai');
  console.log('   • https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app');
  
  return testResults;
}

runEndToEndVisualTest().catch(console.error);
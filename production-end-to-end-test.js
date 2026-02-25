// End-to-End Testing on Production Deployment
const https = require('https');

console.log('🚀 END-TO-END PRODUCTION TESTING');
console.log('========================================\n');

const productionUrl = 'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app';
const domainUrl = 'https://cubiqo.ai';

async function testProductionDeployment() {
  console.log('🎯 TESTING PRODUCTION DEPLOYMENT');
  console.log('========================================\n');
  
  console.log('1. 🔗 CHECKING PRODUCTION URLS\n');
  
  // Test main deployment
  console.log('Main Deployment:', productionUrl);
  const mainResult = await fetchUrl(productionUrl);
  console.log(`   Status: ${mainResult.status} ${mainResult.status === 200 ? '✅' : '❌'}`);
  console.log(`   Vercel ID: ${mainResult.headers['x-vercel-id'] || 'None'}`);
  console.log(`   Cache: ${mainResult.headers['x-vercel-cache'] || 'None'}`);
  console.log(`   Size: ${mainResult.data.length} bytes`);
  
  // Test domain
  console.log('\nDomain:', domainUrl);
  const domainResult = await fetchUrl(domainUrl);
  console.log(`   Status: ${domainResult.status} ${domainResult.status === 307 ? '✅ (Redirect)' : domainResult.status === 200 ? '✅' : '❌'}`);
  if (domainResult.status === 307) {
    console.log(`   Location: ${domainResult.headers['location'] || 'Unknown'}`);
  }
  
  console.log('\n2. 🎨 CHECKING DEPLOYED FEATURES\n');
  
  // Check homepage for EnergyCube
  console.log('Checking homepage for EnergyCube indicators...');
  const homepageHtml = mainResult.data.toString();
  
  const energyCubeChecks = [
    { name: 'Three.js references', found: homepageHtml.includes('three') || homepageHtml.includes('THREE') },
    { name: 'Canvas elements', found: homepageHtml.toLowerCase().includes('<canvas') },
    { name: 'EnergyCube text', found: homepageHtml.includes('EnergyCube') },
    { name: 'WebGL references', found: homepageHtml.toLowerCase().includes('webgl') },
    { name: 'Orange color scheme', found: homepageHtml.toLowerCase().includes('orange') || homepageHtml.includes('#ff6b35') }
  ];
  
  energyCubeChecks.forEach(check => {
    console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
  });
  
  // Check for PR #194 specific changes
  if (homepageHtml.includes('EnergyCubeScene')) {
    console.log('   ✅ EnergyCubeScene present (PR #194 applied)');
  }
  
  if (homepageHtml.includes('PlasmaWaveField')) {
    console.log('   ⚠️ PlasmaWaveField present (check PR #194)');
  }
  
  console.log('\n3. 🔐 TESTING FOUNDERSPASS SYSTEM\n');
  
  // Test FoundersPass endpoints
  const foundersEndpoints = [
    { path: '/founderspass', name: 'Login Page' },
    { path: '/founderspass/dashboard', name: 'Dashboard' },
    { path: '/api/founderspass/catalog', name: 'Catalog API' },
    { path: '/api/founderspass/toggle', name: 'Toggle API', method: 'POST' }
  ];
  
  for (const endpoint of foundersEndpoints) {
    try {
      let result;
      if (endpoint.method === 'POST') {
        // For POST endpoints, just check they exist
        result = await fetchUrl(`${productionUrl}${endpoint.path}`, { method: 'GET' });
      } else {
        result = await fetchUrl(`${productionUrl}${endpoint.path}`);
      }
      
      console.log(`${endpoint.name}:`);
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ Accessible`);
        
        if (endpoint.path === '/api/founderspass/catalog') {
          try {
            const data = JSON.parse(result.data);
            console.log(`   📊 Features: ${data.length || data.features?.length || 'Unknown'} items`);
          } catch (e) {
            console.log(`   📝 Response: ${result.data.substring(0, 100)}...`);
          }
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️ Not found (may be client-side route)`);
      } else if (result.status === 500) {
        console.log(`   ❌ Server error (check database connection)`);
        console.log(`   Error: ${result.data.substring(0, 200)}...`);
      } else if (result.status === 405 && endpoint.method === 'POST') {
        console.log(`   ✅ POST endpoint exists (405 Method Not Allowed for GET)`);
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`${endpoint.name}: ❌ ${error.message}`);
    }
    console.log('');
  }
  
  console.log('4. 🔌 TESTING DATABASE CONNECTIVITY\n');
  
  // Test if database is connected by checking API responses
  console.log('Checking database connectivity via API...');
  
  try {
    const catalogResult = await fetchUrl(`${productionUrl}/api/founderspass/catalog`);
    
    if (catalogResult.status === 200) {
      console.log('   ✅ Catalog API working - database connected');
      try {
        const data = JSON.parse(catalogResult.data);
        console.log(`   📊 Data returned: ${JSON.stringify(data).length} bytes`);
      } catch (e) {
        console.log(`   📝 Non-JSON response (check format)`);
      }
    } else if (catalogResult.status === 500) {
      console.log('   ❌ Database connection error');
      console.log(`   Error: ${catalogResult.data.substring(0, 200)}...`);
    } else {
      console.log(`   ⚠️ Unexpected status: ${catalogResult.status}`);
    }
  } catch (error) {
    console.log(`   ❌ API error: ${error.message}`);
  }
  
  console.log('\n5. 🏗️ CHECKING UI COMPONENTS\n');
  
  // Check for specific UI components
  console.log('Checking for UI components...');
  
  // Load dashboard page to check for feature toggles
  try {
    const dashboardResult = await fetchUrl(`${productionUrl}/founderspass/dashboard`);
    const dashboardHtml = dashboardResult.data.toString().toLowerCase();
    
    const uiChecks = [
      { name: 'Feature list', found: dashboardHtml.includes('feature') },
      { name: 'Toggle controls', found: dashboardHtml.includes('toggle') || dashboardHtml.includes('switch') },
      { name: 'Dashboard layout', found: dashboardHtml.includes('dashboard') },
      { name: 'Settings/controls', found: dashboardHtml.includes('control') || dashboardHtml.includes('setting') },
      { name: 'React components', found: dashboardHtml.includes('react') || dashboardHtml.includes('useclient') }
    ];
    
    uiChecks.forEach(check => {
      console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    if (dashboardResult.status === 200) {
      console.log(`   📏 Dashboard size: ${dashboardResult.data.length} bytes`);
    }
    
  } catch (error) {
    console.log(`   ❌ Dashboard error: ${error.message}`);
  }
  
  console.log('\n========================================');
  console.log('📊 PRODUCTION TEST SUMMARY');
  console.log('========================================\n');
  
  // Generate summary
  const summary = {
    deployment: {
      main: mainResult.status === 200,
      domain: domainResult.status === 307 || domainResult.status === 200,
      vercelId: !!mainResult.headers['x-vercel-id']
    },
    features: {
      energyCube: energyCubeChecks.filter(c => c.found).length,
      hasCanvas: homepageHtml.toLowerCase().includes('<canvas'),
      hasThreeJs: homepageHtml.includes('three') || homepageHtml.includes('THREE')
    },
    foundersPass: {
      loginPage: false,
      dashboard: false,
      catalogApi: false,
      databaseConnected: false
    }
  };
  
  // Update foundersPass status (simplified)
  console.log('✅ DEPLOYMENT STATUS:');
  console.log(`   • Main URL: ${summary.deployment.main ? '✅ LIVE' : '❌ OFFLINE'}`);
  console.log(`   • Domain: ${summary.deployment.domain ? '✅ RESPONDING' : '❌ OFFLINE'}`);
  console.log(`   • Vercel: ${summary.deployment.vercelId ? '✅ DEPLOYED' : '❌ NOT VERCEL'}`);
  
  console.log('\n✅ FEATURE STATUS:');
  console.log(`   • EnergyCube indicators: ${summary.features.energyCube}/5`);
  console.log(`   • Canvas element: ${summary.features.hasCanvas ? '✅' : '❌'}`);
  console.log(`   • Three.js: ${summary.features.hasThreeJs ? '✅' : '❌'}`);
  
  console.log('\n🎯 MANUAL TESTING REQUIRED:');
  console.log('');
  console.log('1. 🎨 VISUAL TEST - EnergyCube:');
  console.log(`   ${productionUrl}`);
  console.log('   • Open in browser');
  console.log('   • Look for 3D animations');
  console.log('   • Verify orange design');
  console.log('   • Check ribbon-to-cube morphing');
  console.log('');
  console.log('2. 🔐 FOUNDERSPASS FLOW:');
  console.log(`   ${productionUrl}/founderspass`);
  console.log('   • Enter PIN: 2026');
  console.log('   • Access dashboard');
  console.log('   • Test feature toggles');
  console.log('   • Verify changes persist (database)');
  console.log('');
  console.log('3. 🌐 DOMAIN TEST:');
  console.log(`   ${domainUrl}`);
  console.log('   • Verify redirects to production');
  console.log('   • Test all features work via domain');
  console.log('');
  console.log('4. 🔧 DATABASE TEST:');
  console.log('   • Toggle features in dashboard');
  console.log('   • Refresh page - changes should persist');
  console.log('   • Check audit logs if available');
  console.log('');
  console.log('📊 EXPECTED RESULTS:');
  console.log('   • EnergyCube animations visible');
  console.log('   • FoundersPass login works');
  console.log('   • Feature toggles persist');
  console.log('   • Database connected');
  console.log('   • All PR changes applied');
  
  return summary;
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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
    
    if (options.method === 'POST') {
      req.write(JSON.stringify({ test: true }));
    }
    
    req.end();
  });
}

testProductionDeployment().catch(console.error);
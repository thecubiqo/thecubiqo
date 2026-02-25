// Test the complete FoundersPass flow
const https = require('https');

console.log('🔐 TESTING COMPLETE FOUNDERSPASS FLOW');
console.log('========================================\n');

const baseUrl = 'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app';

async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { ...options }, (res) => {
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

async function testFlow() {
  console.log('🚀 Testing FoundersPass Authentication Flow\n');
  
  // Step 1: Check login page
  console.log('1. 🔍 Checking FoundersPass login page...');
  try {
    const loginPage = await fetchUrl(`${baseUrl}/founderspass`);
    console.log(`   ✅ Status: ${loginPage.status}`);
    
    if (loginPage.status === 200) {
      const html = loginPage.data.toLowerCase();
      
      // Check for key elements
      const checks = [];
      if (html.includes('pin')) checks.push('PIN field');
      if (html.includes('founder')) checks.push('Founder text');
      if (html.includes('2026')) checks.push('PIN hint');
      if (html.includes('submit') || html.includes('button')) checks.push('Submit button');
      
      console.log(`   ✅ Elements found: ${checks.join(', ')}`);
      console.log(`   📏 Page size: ${loginPage.data.length} bytes`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Step 2: Check dashboard (should redirect or show auth required)
  console.log('2. 🔍 Checking dashboard access (without auth)...');
  try {
    const dashboard = await fetchUrl(`${baseUrl}/founderspass/dashboard`);
    console.log(`   ✅ Status: ${dashboard.status}`);
    
    if (dashboard.status === 200) {
      console.log(`   ⚠️  Dashboard accessible without auth (may be client-side check)`);
      console.log(`   📏 Page size: ${dashboard.data.length} bytes`);
      
      // Check if it's the actual dashboard or a redirect
      const html = dashboard.data.toLowerCase();
      if (html.includes('feature') && html.includes('toggle')) {
        console.log(`   ✅ Feature toggle UI detected`);
      }
    } else if (dashboard.status === 404) {
      console.log(`   ⚠️  Dashboard not found (may be client-side routing)`);
    } else if (dashboard.status >= 300 && dashboard.status < 400) {
      console.log(`   🔄 Redirecting (status ${dashboard.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Step 3: Check API endpoints
  console.log('3. 🔍 Checking API endpoints...');
  
  const apiEndpoints = [
    { path: '/api/founderspass/catalog', name: 'Catalog API' },
    { path: '/api/founderspass/toggle', name: 'Toggle API' },
    { path: '/api/health', name: 'Health API' }
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const result = await fetchUrl(`${baseUrl}${endpoint.path}`);
      console.log(`   ${endpoint.name}: Status ${result.status}`);
      
      if (result.status === 500) {
        console.log(`     ⚠️  Server error - check deployment logs`);
        // Try to get error details
        if (result.data && result.data.length < 1000) {
          console.log(`     Error details: ${result.data.substring(0, 200)}...`);
        }
      } else if (result.status === 404) {
        console.log(`     ⚠️  Not found - may be client-side only`);
      } else if (result.status === 200) {
        console.log(`     ✅ Working`);
        try {
          const json = JSON.parse(result.data);
          console.log(`     📊 Response: ${JSON.stringify(json).substring(0, 100)}...`);
        } catch (e) {
          console.log(`     📝 Non-JSON response`);
        }
      }
    } catch (error) {
      console.log(`   ${endpoint.name}: ❌ ${error.message}`);
    }
  }
  
  console.log('');
  
  // Step 4: Check for EnergyCube on homepage
  console.log('4. 🎨 Checking EnergyCube on homepage...');
  try {
    const homepage = await fetchUrl(baseUrl);
    console.log(`   ✅ Homepage status: ${homepage.status}`);
    
    if (homepage.status === 200) {
      const html = homepage.data;
      
      // Look for EnergyCube/WebGL indicators
      const indicators = {
        'Three.js': html.includes('three') || html.includes('THREE'),
        'WebGL': html.includes('webgl') || html.includes('WEBGL'),
        'Canvas': html.includes('canvas'),
        'EnergyCube': html.includes('EnergyCube') || html.includes('energycube'),
        'PlasmaWave': html.includes('PlasmaWave') || html.includes('plasmawave'),
        'Ribbon': html.includes('Ribbon') || html.includes('ribbon'),
        'Morph': html.includes('Morph') || html.includes('morph')
      };
      
      console.log('   🔍 EnergyCube indicators:');
      Object.entries(indicators).forEach(([name, found]) => {
        console.log(`     ${found ? '✅' : '❌'} ${name}`);
      });
      
      // Check for orange design
      if (html.includes('orange') || html.includes('amber') || html.includes('#ff6b35')) {
        console.log(`   🎨 Orange design elements detected`);
      }
      
      console.log(`   📏 Homepage size: ${html.length} bytes`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Step 5: Manual testing instructions
  console.log('========================================');
  console.log('🎯 MANUAL TESTING INSTRUCTIONS');
  console.log('');
  console.log('1. 🚀 ACCESS THE SITE:');
  console.log(`   ${baseUrl}`);
  console.log('');
  console.log('2. 🔐 TEST FOUNDERSPASS:');
  console.log(`   a. Go to: ${baseUrl}/founderspass`);
  console.log(`   b. Enter PIN: 2026`);
  console.log(`   c. Click Submit`);
  console.log(`   d. You should be redirected to dashboard`);
  console.log('');
  console.log('3. 🎨 TEST ENERGYCUBE:');
  console.log(`   a. Visit homepage`);
  console.log(`   b. Look for 3D animations`);
  console.log(`   c. Check if ribbons morph to cube`);
  console.log(`   d. Verify orange color scheme`);
  console.log('');
  console.log('4. 🔧 TEST FEATURE TOGGLES:');
  console.log(`   a. In dashboard, find feature toggles`);
  console.log(`   b. Toggle some features on/off`);
  console.log(`   c. Check if changes are reflected`);
  console.log('');
  console.log('5. 🏗️ TEST UI STRUCTURE:');
  console.log(`   a. Check layout is correct`);
  console.log(`   b. Verify no visual glitches`);
  console.log(`   c. Test on different screen sizes`);
  console.log('');
  console.log('📊 TEST NOTES:');
  console.log(`   • PR deployment: ${baseUrl}`);
  console.log(`   • FoundersPass PIN: 2026`);
  console.log(`   • API 500 errors may be expected (no database connection in PR)`);
  console.log(`   • Visual tests require manual verification`);
  console.log(`   • Production deployment still in progress`);
}

testFlow().catch(console.error);
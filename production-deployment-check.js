// Monitor Production Deployment Status
const https = require('https');

console.log('🚀 MONITORING PRODUCTION DEPLOYMENT');
console.log('========================================\n');

// URLs to check for production deployment
const productionUrls = [
  'https://cubiqo.ai',
  'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app',
  'https://cubiqo-repo-git-phase2-cubiqo-projects-d7156840.vercel.app' // older
];

// Also check if PR deployment is still the latest
const prUrl = 'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app';

async function checkDeployment(url, name) {
  console.log(`🔍 Checking: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await fetchUrl(url);
    console.log(`   ✅ Status: ${result.status}`);
    
    // Check for deployment indicators
    const headers = result.headers;
    console.log(`   🏷️  Vercel ID: ${headers['x-vercel-id'] || 'Not found'}`);
    console.log(`   💾 Cache: ${headers['x-vercel-cache'] || 'Not specified'}`);
    
    // Check if it's the same as PR deployment
    if (url.includes('git-main') || url === 'https://cubiqo.ai') {
      // Try to check build timestamp or version
      const html = result.data.toString().toLowerCase();
      
      // Look for build indicators
      if (html.includes('build') || html.includes('version') || html.includes('deploy')) {
        console.log(`   📦 Build indicators found`);
      }
      
      // Check size comparison
      console.log(`   📏 Size: ${result.data.length} bytes`);
      
      // Simple content check
      if (html.includes('cubiqo') || html.includes('energycube') || html.includes('founder')) {
        console.log(`   🔍 CubiQo content detected`);
      }
    }
    
    return {
      url,
      name,
      status: result.status,
      vercelId: headers['x-vercel-id'],
      cache: headers['x-vercel-cache'],
      size: result.data.length,
      isLive: result.status === 200 || result.status === 307
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      url,
      name,
      error: error.message,
      isLive: false
    };
  }
  
  console.log('');
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout after 10s'));
    });
  });
}

async function compareDeployments() {
  console.log('📊 COMPARING DEPLOYMENT VERSIONS\n');
  
  const results = [];
  
  // Check all production URLs
  for (const url of productionUrls) {
    const name = url.includes('cubiqo.ai') ? 'Production Domain' : 
                 url.includes('git-main') ? 'Main Branch Deployment' :
                 url.includes('phase2') ? 'Phase2 Deployment (older)' : 'Unknown';
    
    const result = await checkDeployment(url, name);
    results.push(result);
    console.log('');
  }
  
  // Check PR deployment for comparison
  console.log('🔗 PR DEPLOYMENT (for comparison):');
  const prResult = await checkDeployment(prUrl, 'PR Deployment');
  results.push(prResult);
  
  console.log('\n========================================');
  console.log('📈 DEPLOYMENT ANALYSIS');
  console.log('========================================\n');
  
  // Analyze results
  const liveDeployments = results.filter(r => r.isLive);
  const mainDeployment = results.find(r => r.url.includes('git-main'));
  const domainDeployment = results.find(r => r.url.includes('cubiqo.ai'));
  
  console.log(`🌐 Live deployments: ${liveDeployments.length}/${results.length}`);
  
  if (mainDeployment && mainDeployment.isLive) {
    console.log(`✅ Main branch deployment is LIVE: ${mainDeployment.url}`);
    console.log(`   Status: ${mainDeployment.status}`);
    console.log(`   Size: ${mainDeployment.size} bytes`);
    
    // Compare with PR deployment
    if (prResult.isLive) {
      const sizeDiff = Math.abs(mainDeployment.size - prResult.size);
      console.log(`   📊 Compared to PR: ${sizeDiff} bytes difference`);
      
      if (sizeDiff < 1000) {
        console.log(`   🔄 Similar size - likely same build`);
      } else if (mainDeployment.size > prResult.size) {
        console.log(`   📈 Main is larger - may have more features`);
      } else {
        console.log(`   📉 Main is smaller - check for missing content`);
      }
    }
  } else if (mainDeployment && mainDeployment.error) {
    console.log(`❌ Main branch deployment error: ${mainDeployment.error}`);
    console.log(`   ⚠️  May still be building or failed`);
  } else {
    console.log(`⏳ Main branch deployment not found or not accessible`);
  }
  
  console.log('');
  
  if (domainDeployment) {
    if (domainDeployment.status === 307) {
      console.log(`🔗 cubiqo.ai: Redirecting (307)`);
      console.log(`   ✅ Domain is configured to redirect to Vercel`);
    } else if (domainDeployment.status === 200) {
      console.log(`🌍 cubiqo.ai: Directly serving (200)`);
      console.log(`   ✅ Domain is serving content directly`);
    } else {
      console.log(`⚠️  cubiqo.ai: Status ${domainDeployment.status}`);
    }
  }
  
  console.log('\n========================================');
  console.log('🎯 DEPLOYMENT STATUS CHECKLIST');
  console.log('');
  
  // Deployment checklist
  const checklist = [
    { item: 'Main branch deployment accessible', status: mainDeployment?.isLive ? '✅' : '❌' },
    { item: 'cubiqo.ai domain responding', status: domainDeployment?.isLive ? '✅' : '❌' },
    { item: 'Vercel headers present', status: results.some(r => r.vercelId) ? '✅' : '❌' },
    { item: 'PR deployment ready (reference)', status: prResult.isLive ? '✅' : '❌' },
    { item: 'No critical errors', status: results.every(r => !r.error || r.status === 307) ? '✅' : '❌' }
  ];
  
  checklist.forEach(item => {
    console.log(`${item.status} ${item.item}`);
  });
  
  console.log('\n========================================');
  console.log('🔧 NEXT STEPS:');
  console.log('');
  
  if (mainDeployment?.isLive) {
    console.log('1. ✅ Main deployment is LIVE');
    console.log('2. 🔗 Test: ' + mainDeployment.url);
    console.log('3. 🌐 Test: https://cubiqo.ai');
    console.log('4. 🎯 Verify EnergyCube animations');
    console.log('5. 🔐 Test FoundersPass with database');
  } else {
    console.log('1. ⏳ Main deployment still building/failed');
    console.log('2. 🔍 Check Vercel dashboard for build status');
    console.log('3. 🕐 Wait 5-10 more minutes');
    console.log('4. 🎨 Continue testing PR deployment visuals');
    console.log('5. 🔄 Retry main URL in a few minutes');
  }
  
  console.log('\n📊 Deployment Timeline:');
  console.log('   • 18:30 EST: PRs merged to main');
  console.log('   • 18:32 EST: Auto-deploy triggered');
  console.log('   • 18:50 EST: Current check');
  console.log('   • 19:00 EST: Expected completion');
  console.log('');
  console.log('💡 Note: Builds typically take 2-5 minutes');
  console.log('   DNS propagation may add 5-10 minutes');
}

compareDeployments().catch(console.error);
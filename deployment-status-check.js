// Check if deployment is currently happening
const https = require('https');

console.log('🚀 CHECKING IF DEPLOYMENT IS HAPPENING');
console.log('======================================\n');
console.log('Time:', new Date().toLocaleString());
console.log('');

const urls = [
  'https://www.cubiqo.ai',
  'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app'
];

async function checkDeploymentStatus() {
  console.log('🔍 CHECKING ALL URLS:\n');
  
  let anyDeploymentDetected = false;
  
  for (const url of urls) {
    console.log(`Checking: ${url}`);
    
    try {
      const result = await fetchWithTimeout(url, 10000);
      console.log(`   Status: ${result.status}`);
      console.log(`   X-Vercel-Cache: ${result.headers['x-vercel-cache'] || 'None'}`);
      console.log(`   X-Vercel-Id: ${result.headers['x-vercel-id'] || 'None'}`);
      
      const html = result.data.toString();
      
      // Check for deployment indicators
      const hasDeploying = html.includes('deploying') || html.includes('Deploying') || 
                          html.includes('Building') || html.includes('building');
      const hasVercelDeploy = html.includes('Vercel') && (html.includes('deploy') || html.includes('Deploy'));
      const hasMaintenance = html.includes('maintenance') || html.includes('Maintenance');
      
      if (hasDeploying || hasVercelDeploy) {
        console.log(`   🚀 DEPLOYMENT DETECTED: ${hasDeploying ? 'Building/Deploying' : 'Vercel deployment page'}`);
        anyDeploymentDetected = true;
      }
      
      if (hasMaintenance) {
        console.log(`   🛠️  MAINTENANCE MODE DETECTED`);
      }
      
      // Check current state
      const has404 = html.includes('404: This page could not be found');
      const hasErrors = html.includes('$undefined') || html.includes('parallelRouterKey');
      
      console.log(`   Current State: ${has404 || hasErrors ? '❌ BROKEN' : '✅ WORKING'}`);
      if (has404) console.log(`      - 404 content present`);
      if (hasErrors) console.log(`      - React errors present`);
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('📊 DEPLOYMENT ANALYSIS:\n');
  
  if (anyDeploymentDetected) {
    console.log('✅ DEPLOYMENT IS IN PROGRESS');
    console.log('Vercel is currently building/deploying the site.');
    console.log('\n⏱️  Expected timeline:');
    console.log('   - Build completion: 2-3 minutes');
    console.log('   - Cache propagation: 1-2 minutes');
    console.log('   - Total: 3-5 minutes');
    console.log('\n🔍 Check again in 5 minutes at: https://cubiqo.ai');
  } else {
    console.log('❌ NO ACTIVE DEPLOYMENT DETECTED');
    console.log('The site is serving the old broken version.');
    console.log('\n🔧 ACTION REQUIRED:');
    console.log('1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
    console.log('2. Check "Deployments" tab');
    console.log('3. Look for latest commit status');
    console.log('4. If failed/queued, click "Redeploy"');
  }
  
  // Check GitHub for commit status
  console.log('\n🔗 GITHUB COMMIT STATUS:');
  console.log('Latest commit should be: 47185c1 or similar');
  console.log('Check: https://github.com/thecubiqo/thecubiqo/commits/main');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Wait 5 minutes if deployment detected');
  console.log('2. Check https://cubiqo.ai after waiting');
  console.log('3. If still broken, force redeploy in Vercel');
  console.log('4. Clear browser cache (Ctrl+Shift+R)');
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

checkDeploymentStatus().catch(console.error);
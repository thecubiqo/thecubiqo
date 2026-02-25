// Investigate why cubiqo.ai is broken
const https = require('https');

console.log('🔍 INVESTIGATING CUBIQO.AI STATUS');
console.log('========================================\n');
console.log('Time:', new Date().toLocaleString());
console.log('');

const urlsToCheck = [
  'https://cubiqo.ai',
  'https://www.cubiqo.ai',
  'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app',
  'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app'
];

async function checkUrl(url, name) {
  console.log(`🔍 Checking: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await fetchWithTimeout(url, 10000);
    console.log(`   ✅ Status: ${result.status}`);
    
    // Check headers
    console.log(`   🏷️  Server: ${result.headers['server'] || 'Unknown'}`);
    console.log(`   🔗 Location: ${result.headers['location'] || 'No redirect'}`);
    console.log(`   📏 Size: ${result.data.length} bytes`);
    
    // Check for errors in response
    if (result.status >= 400) {
      console.log(`   ❌ Error status: ${result.status}`);
      console.log(`   📝 Response start: ${result.data.substring(0, 200)}...`);
    }
    
    // Check for common error patterns
    const html = result.data.toString().toLowerCase();
    if (html.includes('error') || html.includes('not found') || html.includes('404')) {
      console.log(`   ⚠️  Error content detected`);
    }
    
    if (html.includes('maintenance') || html.includes('down for maintenance')) {
      console.log(`   🛠️  Maintenance mode detected`);
    }
    
    return {
      url,
      name,
      status: result.status,
      success: result.status < 400,
      size: result.data.length,
      hasErrorContent: html.includes('error') || html.includes('404'),
      redirect: result.headers['location']
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      url,
      name,
      error: error.message,
      success: false
    };
  }
  
  console.log('');
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

async function investigate() {
  console.log('🚀 STARTING INVESTIGATION\n');
  
  const results = [];
  
  // Check all URLs
  for (const url of urlsToCheck) {
    const name = url.includes('cubiqo.ai') ? 
                 (url.includes('www.') ? 'www.cubiqo.ai' : 'cubiqo.ai') :
                 url.includes('git-main') ? 'Main Deployment' :
                 'PR Deployment';
    
    const result = await checkUrl(url, name);
    results.push(result);
  }
  
  console.log('\n========================================');
  console.log('📊 INVESTIGATION SUMMARY');
  console.log('========================================\n');
  
  // Analyze results
  const brokenUrls = results.filter(r => !r.success || r.hasErrorContent);
  const workingUrls = results.filter(r => r.success && !r.hasErrorContent);
  
  console.log(`🌐 Total URLs checked: ${results.length}`);
  console.log(`✅ Working: ${workingUrls.length}`);
  console.log(`❌ Broken/Errors: ${brokenUrls.length}`);
  
  if (brokenUrls.length > 0) {
    console.log('\n🚨 BROKEN URLS:');
    brokenUrls.forEach(result => {
      console.log(`   • ${result.name}: ${result.error || `Status ${result.status}`}`);
    });
  }
  
  // Check domain configuration
  const domainResult = results.find(r => r.name === 'cubiqo.ai');
  const wwwResult = results.find(r => r.name === 'www.cubiqo.ai');
  
  console.log('\n🔗 DOMAIN CONFIGURATION:');
  if (domainResult) {
    if (domainResult.status === 301 || domainResult.status === 302 || domainResult.status === 307) {
      console.log(`   cubiqo.ai → Redirecting to: ${domainResult.redirect || 'unknown'}`);
      console.log(`   ✅ Redirect configured correctly`);
    } else if (domainResult.status === 200) {
      console.log(`   cubiqo.ai → Serving directly (no redirect)`);
      console.log(`   ⚠️  May need redirect configuration`);
    } else {
      console.log(`   cubiqo.ai → Status: ${domainResult.status}`);
    }
  }
  
  if (wwwResult) {
    console.log(`   www.cubiqo.ai → Status: ${wwwResult.status}`);
    if (wwwResult.hasErrorContent) {
      console.log(`   ❌ Error content detected on www subdomain`);
    }
  }
  
  // Check deployment status
  const mainDeployment = results.find(r => r.name === 'Main Deployment');
  const prDeployment = results.find(r => r.name === 'PR Deployment');
  
  console.log('\n🚀 DEPLOYMENT STATUS:');
  if (mainDeployment) {
    console.log(`   Main Deployment: ${mainDeployment.success ? '✅ LIVE' : '❌ OFFLINE'}`);
    console.log(`     Status: ${mainDeployment.status}, Size: ${mainDeployment.size} bytes`);
  }
  
  if (prDeployment) {
    console.log(`   PR Deployment: ${prDeployment.success ? '✅ LIVE' : '❌ OFFLINE'}`);
    console.log(`     Status: ${prDeployment.status}, Size: ${prDeployment.size} bytes`);
  }
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:');
  
  if (brokenUrls.length > 0) {
    console.log('1. Check Vercel dashboard for deployment status');
    console.log('2. Check domain DNS configuration');
    console.log('3. Check for build/deployment errors');
    console.log('4. Verify SSL certificates are valid');
  } else {
    console.log('1. All URLs appear to be responding');
    console.log('2. Check browser console for JavaScript errors');
    console.log('3. Verify EnergyCube component is loading');
    console.log('4. Check WebGL support in browser');
  }
  
  console.log('\n🎯 NEXT ACTIONS:');
  console.log('1. Check Vercel: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  console.log('2. Check DNS: Verify cubiqo.ai points to Vercel');
  console.log('3. Check SSL: Ensure certificates are valid');
  console.log('4. Test in different browser/device');
  
  return results;
}

investigate().catch(console.error);
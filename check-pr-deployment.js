// Check the PR deployment that showed as "Ready"
const https = require('https');

console.log('🚀 Checking PR Deployment (Latest Build)...');
console.log('========================================\n');

// From PR comment: cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app
const prDeploymentUrl = 'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app';

async function checkDeployment() {
  console.log(`🔍 Testing PR Deployment: ${prDeploymentUrl}\n`);
  
  try {
    const result = await fetchUrl(prDeploymentUrl);
    console.log(`✅ Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('🎉 Deployment is LIVE and responding!');
      
      // Check for specific content
      const html = result.data.toLowerCase();
      
      console.log('\n🔍 Content Analysis:');
      
      // Check for EnergyCube/WebGL
      if (html.includes('energycube') || html.includes('three.js') || html.includes('webgl')) {
        console.log('   ✅ EnergyCube/WebGL detected');
      } else {
        console.log('   ⚠️  EnergyCube not found in HTML');
      }
      
      // Check for FoundersPass
      if (html.includes('founderspass') || html.includes('founder')) {
        console.log('   ✅ FoundersPass references found');
      }
      
      // Check for React/Next.js
      if (html.includes('__next') || html.includes('react')) {
        console.log('   ✅ Next.js/React detected');
      }
      
      // Check size
      console.log(`   📏 HTML Size: ${result.data.length} bytes`);
      
      // Check headers
      console.log('\n📦 Response Headers:');
      console.log(`   Server: ${result.headers['server'] || 'N/A'}`);
      console.log(`   Vercel ID: ${result.headers['x-vercel-id'] || 'N/A'}`);
      console.log(`   Cache: ${result.headers['x-vercel-cache'] || 'N/A'}`);
      
    } else {
      console.log(`⚠️  Unexpected status: ${result.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n========================================');
  console.log('🎯 Next Steps:');
  console.log('1. The PR deployment is READY (per Vercel comment)');
  console.log('2. Production (cubiqo.ai) may still be deploying');
  console.log('3. Check Vercel dashboard for production deployment status');
  console.log('4. Test features on PR deployment first');
  console.log('\n🔗 PR Deployment URL:');
  console.log(`   ${prDeploymentUrl}`);
  console.log('\n🔗 Test FoundersPass:');
  console.log(`   ${prDeploymentUrl}/founderspass`);
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
      reject(new Error('Timeout'));
    });
  });
}

checkDeployment().catch(console.error);
// Check Vercel deployment status
const https = require('https');

console.log('🚀 Checking Vercel Deployment Status...');
console.log('========================================\n');

// Production URLs to check
const urls = [
  'https://cubiqo.ai',
  'https://cubiqo-repo-git-phase2-cubiqo-projects-d7156840.vercel.app',
  'https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app'
];

const checkUrl = (url) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, (res) => {
      const end = Date.now();
      const responseTime = end - start;
      
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        responseTime: `${responseTime}ms`,
        headers: {
          'x-vercel-id': res.headers['x-vercel-id'],
          'x-vercel-cache': res.headers['x-vercel-cache'],
          server: res.headers['server']
        }
      });
      
      res.on('data', () => {}); // Consume data
      res.on('end', () => {});
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        error: true,
        message: err.message,
        responseTime: 'N/A'
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: true,
        message: 'Timeout after 10s',
        responseTime: 'N/A'
      });
    });
  });
};

async function checkAll() {
  console.log('📊 Checking deployment URLs...\n');
  
  for (const url of urls) {
    console.log(`🔍 Testing: ${url}`);
    const result = await checkUrl(url);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.message}`);
    } else {
      console.log(`   ✅ Status: ${result.status} ${result.statusText}`);
      console.log(`   ⏱️  Response: ${result.responseTime}`);
      
      if (result.headers['x-vercel-id']) {
        console.log(`   🏷️  Vercel ID: ${result.headers['x-vercel-id']}`);
      }
      
      if (result.headers['x-vercel-cache']) {
        console.log(`   💾 Cache: ${result.headers['x-vercel-cache']}`);
      }
    }
    console.log('');
  }
  
  console.log('========================================');
  console.log('🎯 Deployment Verification Steps:');
  console.log('1. Check if site loads (status 200)');
  console.log('2. Verify response time (< 2s ideal)');
  console.log('3. Look for Vercel headers (confirms deployment)');
  console.log('4. Test FoundersPass: /founderspass');
  console.log('5. Test EnergyCube animations');
  console.log('');
  console.log('⚠️  Note: DNS propagation may take a few minutes');
  console.log('   if cubiqo.ai domain was recently updated.');
}

checkAll().catch(console.error);
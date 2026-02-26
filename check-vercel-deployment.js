// Check Vercel deployment status and current site status
const https = require('https');

console.log('🚨 CHECKING VERCEL DEPLOYMENT & SITE STATUS');
console.log('===========================================\n');
console.log('Time:', new Date().toLocaleString());
console.log('');

const urls = [
  'https://www.cubiqo.ai',
  'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app'
];

async function checkDeployment() {
  console.log('🔍 CHECKING DEPLOYMENT STATUS:\n');
  
  for (const url of urls) {
    console.log(`Checking: ${url}`);
    
    try {
      const result = await fetchWithTimeout(url, 10000);
      console.log(`   Status: ${result.status}`);
      console.log(`   Server: ${result.headers['server'] || 'Unknown'}`);
      console.log(`   X-Vercel-Cache: ${result.headers['x-vercel-cache'] || 'None'}`);
      console.log(`   X-Vercel-Id: ${result.headers['x-vercel-id'] || 'None'}`);
      console.log(`   Size: ${result.data.length} bytes`);
      
      const html = result.data.toString();
      
      // Check for deployment indicators
      const hasDeploying = html.includes('deploying') || html.includes('Deploying');
      const hasBuilding = html.includes('building') || html.includes('Building');
      const hasVercelError = html.includes('vercel') && html.includes('error');
      
      if (hasDeploying || hasBuilding) {
        console.log(`   ⚠️  DEPLOYMENT IN PROGRESS`);
      }
      
      if (hasVercelError) {
        console.log(`   ❌ VERCEL ERROR DETECTED`);
      }
      
      // Check for our fixes
      console.log(`\n   🔧 CHECKING FIXES:`);
      
      const has404Content = html.includes('404: This page could not be found');
      const hasUndefinedProps = html.includes('$undefined');
      const hasParallelRouter = html.includes('parallelRouterKey');
      const hasNextRoot = html.includes('id="__next"');
      const hasCanvas = html.includes('<canvas');
      
      console.log(`     404 content: ${has404Content ? '❌ STILL PRESENT' : '✅ FIXED'}`);
      console.log(`     $undefined props: ${hasUndefinedProps ? '❌ STILL PRESENT' : '✅ FIXED'}`);
      console.log(`     Parallel router: ${hasParallelRouter ? '❌ STILL PRESENT' : '✅ FIXED'}`);
      console.log(`     Next.js root: ${hasNextRoot ? '✅ PRESENT' : '❌ MISSING'}`);
      console.log(`     Canvas element: ${hasCanvas ? '✅ PRESENT' : '❌ MISSING'}`);
      
      // Check HTML structure
      const isMinimalHtml = html.length < 10000;
      console.log(`     HTML size: ${isMinimalHtml ? '⚠️  TOO SMALL' : '✅ NORMAL'}`);
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Check GitHub Actions for deployment status
  console.log('\n🔗 GITHUB ACTIONS STATUS:');
  console.log('https://github.com/thecubiqo/thecubiqo/actions');
  
  console.log('\n🔗 VERCEL DASHBOARD:');
  console.log('https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  
  console.log('\n🎯 TROUBLESHOOTING STEPS:');
  console.log('1. Check Vercel dashboard for deployment status');
  console.log('2. Clear browser cache (Ctrl+Shift+R)');
  console.log('3. Try incognito/private mode');
  console.log('4. Test different browser (Chrome, Firefox, Edge)');
  console.log('5. Check browser console for JavaScript errors (F12)');
  
  console.log('\n🚨 IF STILL BROKEN AFTER 10 MINUTES:');
  console.log('1. Force redeploy in Vercel dashboard');
  console.log('2. Clear Vercel deployment cache');
  console.log('3. Check environment variables in Vercel');
  console.log('4. Verify Supabase keys are correct');
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

checkDeployment().catch(console.error);
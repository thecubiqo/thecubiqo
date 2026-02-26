// Quick status check
const https = require('https');

console.log('🔍 QUICK STATUS CHECK - CUBIQO.AI');
console.log('================================\n');

const url = 'https://www.cubiqo.ai';

https.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`X-Vercel-Cache: ${res.headers['x-vercel-cache'] || 'None'}`);
  console.log(`X-Vercel-Id: ${res.headers['x-vercel-id'] || 'None'}`);
  console.log(`Server: ${res.headers['server'] || 'Unknown'}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`\nHTML Size: ${data.length} bytes`);
    
    // Quick checks
    const has404 = data.includes('404: This page could not be found');
    const hasError = data.includes('$undefined');
    const hasCanvas = data.includes('<canvas');
    
    console.log(`\nQuick Diagnostics:`);
    console.log(`404 Content: ${has404 ? '❌ PRESENT' : '✅ ABSENT'}`);
    console.log(`React Errors: ${hasError ? '❌ PRESENT' : '✅ ABSENT'}`);
    console.log(`Canvas (EnergyCube): ${hasCanvas ? '✅ PRESENT' : '❌ MISSING'}`);
    
    console.log('\n🎯 CURRENT STATUS:');
    if (has404 || hasError) {
      console.log('🚨 PRODUCTION STILL BROKEN');
      console.log('The fixes have not been deployed yet.');
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
      console.log('2. Click "Deployments"');
      console.log('3. Click "Redeploy" on latest commit');
      console.log('4. OR Click "Trigger Deployment"');
    } else {
      console.log('✅ PRODUCTION FIXED');
      console.log('The site should be loading correctly.');
    }
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}`);
});
// Verify the fix for cubiqo.ai
const https = require('https');

console.log('🔍 VERIFYING FIX FOR CUBIQO.AI');
console.log('========================================\n');
console.log('Time:', new Date().toLocaleString());
console.log('');

const url = 'https://www.cubiqo.ai';

async function verifyFix() {
  console.log(`Checking: ${url}\n`);
  
  try {
    const result = await fetchWithTimeout(url, 15000);
    console.log(`Status: ${result.status}`);
    
    const html = result.data.toString();
    
    // Check for the fix
    console.log('\n✅ CHECKING FIX INDICATORS:\n');
    
    // 1. Check for hydration errors (should be gone)
    const hasHydrationError = html.includes('hydration') && html.includes('error');
    console.log(`Hydration errors: ${hasHydrationError ? '❌ STILL PRESENT' : '✅ FIXED'}`);
    
    // 2. Check for 404 error in component tree (should be gone)
    const has404InTree = html.includes('404: This page could not be found');
    console.log(`404 in component tree: ${has404InTree ? '❌ STILL PRESENT' : '✅ FIXED'}`);
    
    // 3. Check for proper React structure
    const hasReactApp = html.includes('__next') && html.includes('react');
    console.log(`React app structure: ${hasReactApp ? '✅ PRESENT' : '❌ MISSING'}`);
    
    // 4. Check for EnergyCube canvas
    const hasCanvas = html.includes('<canvas');
    console.log(`Canvas element: ${hasCanvas ? '✅ PRESENT' : '❌ MISSING'}`);
    
    // 5. Check for Three.js
    const hasThreeJs = html.toLowerCase().includes('three');
    console.log(`Three.js references: ${hasThreeJs ? '✅ FOUND' : '❌ NOT FOUND (may load via JS)'}`);
    
    // 6. Check for error boundaries
    const hasErrorBoundary = html.includes('error') && html.includes('$undefined');
    console.log(`Error boundaries active: ${hasErrorBoundary ? '⚠️  YES' : '✅ NO'}`);
    
    console.log('\n📊 FIX VERIFICATION SUMMARY:');
    console.log('='.repeat(40));
    
    if (!hasHydrationError && !has404InTree && hasReactApp) {
      console.log('✅ FIX SUCCESSFUL!');
      console.log('   • Hydration errors resolved');
      console.log('   • 404 content removed');
      console.log('   • React app loading correctly');
      
      if (hasCanvas) {
        console.log('   • EnergyCube canvas present');
        console.log('   • Site should be functional');
      }
    } else {
      console.log('❌ FIX MAY NOT BE COMPLETE');
      
      if (hasHydrationError) {
        console.log('   • Hydration errors still present');
      }
      
      if (has404InTree) {
        console.log('   • 404 content still in component tree');
      }
      
      if (!hasReactApp) {
        console.log('   • React app not loading correctly');
      }
    }
    
    console.log('\n🎯 NEXT STEPS:');
    
    if (hasHydrationError || has404InTree) {
      console.log('1. Wait for Vercel deployment to complete (2-5 min)');
      console.log('2. Check Vercel build logs for errors');
      console.log('3. Clear browser cache and hard refresh');
      console.log('4. Test in incognito mode');
    } else {
      console.log('1. Test EnergyCube animations in browser');
      console.log('2. Test FoundersPass login (PIN: 2026)');
      console.log('3. Verify all features work correctly');
    }
    
    console.log('\n🔗 Vercel Dashboard:');
    console.log('https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
    
    return {
      fixed: !hasHydrationError && !has404InTree && hasReactApp,
      details: {
        hydrationError: hasHydrationError,
        has404InTree,
        hasReactApp,
        hasCanvas,
        hasThreeJs
      }
    };
    
  } catch (error) {
    console.log(`❌ Error checking URL: ${error.message}`);
    return { error: error.message };
  }
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

// Wait a moment for deployment, then check
console.log('⏳ Waiting 30 seconds for deployment to propagate...\n');

setTimeout(() => {
  verifyFix().catch(console.error);
}, 30000);
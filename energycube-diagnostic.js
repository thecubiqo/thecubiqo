// EnergyCube Diagnostic Script
const https = require('https');

console.log('🔍 ENERGYCUBE DIAGNOSTIC CHECK');
console.log('========================================\n');

const productionUrl = 'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app';

async function checkEnergyCubeAssets() {
  console.log('1. 🔍 CHECKING FOR ENERGYCUBE ASSETS\n');
  
  // First, get the homepage HTML
  const homepage = await fetchUrl(productionUrl);
  const html = homepage.data.toString();
  
  // Look for EnergyCube/Three.js indicators
  console.log('Searching HTML for EnergyCube indicators...\n');
  
  // Check for canvas
  const hasCanvas = html.includes('<canvas');
  console.log(`✅ Canvas element: ${hasCanvas ? 'FOUND' : 'NOT FOUND'}`);
  
  // Check for Three.js in script tags
  const threeJsPatterns = [
    'three.js',
    'three.min.js', 
    'THREE',
    'webgl',
    'EnergyCube',
    'PlasmaWave',
    'ribbon',
    'morph'
  ];
  
  console.log('\nSearching for Three.js/WebGL patterns:');
  threeJsPatterns.forEach(pattern => {
    const found = html.toLowerCase().includes(pattern.toLowerCase());
    console.log(`   ${found ? '✅' : '❌'} ${pattern}`);
  });
  
  // Check for specific component imports
  console.log('\n2. 🔧 CHECKING COMPONENT STRUCTURE\n');
  
  // Look for React component patterns
  const componentPatterns = [
    'EnergyCubeScene',
    'EnergyCube',
    'ThreeScene',
    'WebGLBackground',
    'CanvasBackground'
  ];
  
  console.log('Possible component names:');
  componentPatterns.forEach(pattern => {
    const found = html.includes(pattern);
    console.log(`   ${found ? '✅' : '❌'} ${pattern}`);
  });
  
  // Check JavaScript bundle names
  console.log('\n3. 📦 ANALYZING JS BUNDLE NAMES\n');
  
  // Extract all script src attributes
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
  const scripts = [];
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  
  console.log(`Found ${scripts.length} script tags`);
  
  // Look for Three.js related bundles
  const threeJsBundles = scripts.filter(src => 
    src.includes('three') || 
    src.includes('webgl') ||
    src.includes('canvas') ||
    src.includes('scene') ||
    src.includes('3d')
  );
  
  if (threeJsBundles.length > 0) {
    console.log('✅ Possible Three.js bundles:');
    threeJsBundles.forEach(bundle => {
      console.log(`   • ${bundle}`);
    });
  } else {
    console.log('❌ No obvious Three.js bundles found in HTML');
    console.log('   💡 Three.js may load dynamically via JavaScript');
  }
  
  // Check for inline scripts with Three.js
  console.log('\n4. 📝 CHECKING FOR INLINE THREE.JS CODE\n');
  
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  const inlineScripts = [];
  
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    if (match[1].length > 50) { // Only check substantial scripts
      inlineScripts.push(match[1].substring(0, 200) + '...');
    }
  }
  
  console.log(`Found ${inlineScripts.length} inline scripts`);
  
  // Check if any inline script mentions Three.js
  const hasThreeJsInline = inlineScripts.some(script => 
    script.toLowerCase().includes('three') ||
    script.includes('THREE')
  );
  
  console.log(`Three.js in inline scripts: ${hasThreeJsInline ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n5. 🎯 DIAGNOSTIC SUMMARY\n');
  
  const diagnostics = {
    hasCanvas,
    hasThreeJsInHtml: threeJsPatterns.some(p => html.toLowerCase().includes(p.toLowerCase())),
    hasThreeJsBundle: threeJsBundles.length > 0,
    hasThreeJsInline,
    totalScripts: scripts.length,
    componentFound: componentPatterns.some(p => html.includes(p))
  };
  
  console.log('Diagnostic Results:');
  console.log(`   • Canvas element: ${diagnostics.hasCanvas ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`   • Three.js in HTML: ${diagnostics.hasThreeJsInHtml ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   • Three.js bundles: ${diagnostics.hasThreeJsBundle ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   • Three.js inline: ${diagnostics.hasThreeJsInline ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   • Component references: ${diagnostics.componentFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
  
  console.log('\n6. 🔧 RECOMMENDED TROUBLESHOOTING\n');
  
  if (!diagnostics.hasCanvas) {
    console.log('🚨 CRITICAL: No canvas element found');
    console.log('   • EnergyCube cannot render without canvas');
    console.log('   • Check if component is mounted');
  } else if (!diagnostics.hasThreeJsInHtml && !diagnostics.hasThreeJsBundle) {
    console.log('⚠️ WARNING: Three.js not detected in initial load');
    console.log('   • Three.js may load dynamically');
    console.log('   • Check browser console for loading errors');
    console.log('   • Check Network tab for Three.js bundle requests');
  } else {
    console.log('✅ HTML structure looks correct');
    console.log('   • Canvas present for WebGL');
    console.log('   • Check browser console for runtime errors');
  }
  
  console.log('\n7. 🎨 MANUAL TEST REQUIRED\n');
  
  console.log('Please check in browser:');
  console.log('1. Open Console (F12) → Look for errors');
  console.log('2. Check Network tab → Filter for "three" or "webgl"');
  console.log('3. Check if canvas is visible (should be fullscreen)');
  console.log('4. Check if canvas has WebGL context:');
  console.log('');
  console.log('   // Paste in browser console:');
  console.log('   const canvas = document.querySelector("canvas");');
  console.log('   console.log("Canvas:", canvas);');
  console.log('   const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");');
  console.log('   console.log("WebGL context:", !!gl);');
  console.log('   console.log("Three.js loaded:", typeof THREE !== "undefined");');
  
  return diagnostics;
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

checkEnergyCubeAssets().catch(console.error);
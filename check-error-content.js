// Check what error content is being served
const https = require('https');

console.log('🔍 CHECKING ERROR CONTENT ON CUBIQO.AI');
console.log('========================================\n');

const url = 'https://www.cubiqo.ai';

async function checkErrorContent() {
  console.log(`Checking: ${url}\n`);
  
  try {
    const result = await fetchWithTimeout(url, 10000);
    console.log(`Status: ${result.status}`);
    console.log(`Content-Type: ${result.headers['content-type'] || 'Unknown'}`);
    console.log(`Size: ${result.data.length} bytes\n`);
    
    const html = result.data.toString();
    
    // Look for error patterns
    console.log('🔍 SEARCHING FOR ERROR PATTERNS:\n');
    
    const errorPatterns = [
      { pattern: 'error', name: 'Error text' },
      { pattern: 'not found', name: 'Not found' },
      { pattern: '404', name: '404 error' },
      { pattern: 'failed to load', name: 'Load failure' },
      { pattern: 'cannot read', name: 'JavaScript error' },
      { pattern: 'undefined', name: 'Undefined error' },
      { pattern: 'syntax error', name: 'Syntax error' },
      { pattern: 'network error', name: 'Network error' },
      { pattern: 'maintenance', name: 'Maintenance mode' },
      { pattern: 'down for', name: 'Down message' }
    ];
    
    errorPatterns.forEach(({ pattern, name }) => {
      const regex = new RegExp(pattern, 'gi');
      const matches = html.match(regex);
      if (matches) {
        console.log(`✅ ${name}: FOUND (${matches.length} occurrences)`);
        
        // Show context for first match
        const index = html.toLowerCase().indexOf(pattern);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(html.length, index + pattern.length + 50);
          console.log(`   Context: ...${html.substring(start, end)}...`);
        }
      }
    });
    
    // Check for React/Next.js errors
    console.log('\n🔧 CHECKING REACT/NEXT.JS ERRORS:\n');
    
    const reactPatterns = [
      { pattern: 'hydration', name: 'Hydration error' },
      { pattern: 'react', name: 'React error' },
      { pattern: 'next', name: 'Next.js error' },
      { pattern: 'minified react', name: 'Minified React error' },
      { pattern: 'uncaught', name: 'Uncaught error' },
      { pattern: 'invariant', name: 'Invariant violation' }
    ];
    
    reactPatterns.forEach(({ pattern, name }) => {
      if (html.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`⚠️  ${name}: DETECTED`);
      }
    });
    
    // Check for script loading errors
    console.log('\n📦 CHECKING SCRIPT LOADING:\n');
    
    // Count script tags
    const scriptCount = (html.match(/<script/gi) || []).length;
    console.log(`Script tags: ${scriptCount}`);
    
    // Check for failed script references
    const failedScripts = html.match(/src=["'][^"']*\.js[^"']*["']/gi) || [];
    console.log(`JavaScript files referenced: ${failedScripts.length}`);
    
    // Check for common error pages
    console.log('\n🌐 CHECKING FOR COMMON ERROR PAGES:\n');
    
    if (html.includes('This page could not be found')) {
      console.log('❌ 404 Error Page detected');
    }
    
    if (html.includes('Internal Server Error') || html.includes('500')) {
      console.log('❌ 500 Internal Server Error');
    }
    
    if (html.includes('Bad Gateway') || html.includes('502')) {
      console.log('❌ 502 Bad Gateway');
    }
    
    if (html.includes('Service Unavailable') || html.includes('503')) {
      console.log('❌ 503 Service Unavailable');
    }
    
    // Check HTML structure
    console.log('\n🏗️ CHECKING HTML STRUCTURE:\n');
    
    const hasDoctype = html.includes('<!DOCTYPE');
    const hasHtmlTag = html.includes('<html');
    const hasBodyTag = html.includes('<body');
    const hasHeadTag = html.includes('<head');
    
    console.log(`<!DOCTYPE>: ${hasDoctype ? '✅' : '❌'}`);
    console.log(`<html>: ${hasHtmlTag ? '✅' : '❌'}`);
    console.log(`<head>: ${hasHeadTag ? '✅' : '❌'}`);
    console.log(`<body>: ${hasBodyTag ? '✅' : '❌'}`);
    
    // Check for canvas (EnergyCube)
    const hasCanvas = html.includes('<canvas');
    console.log(`<canvas> (EnergyCube): ${hasCanvas ? '✅' : '❌'}`);
    
    // Check for Three.js
    const hasThreeJs = html.toLowerCase().includes('three');
    console.log(`Three.js references: ${hasThreeJs ? '✅' : '❌'}`);
    
    // Show first 500 chars of HTML for quick inspection
    console.log('\n📄 HTML PREVIEW (first 500 chars):');
    console.log('='.repeat(50));
    console.log(html.substring(0, 500));
    console.log('='.repeat(50));
    
    return {
      status: result.status,
      size: result.data.length,
      hasErrors: errorPatterns.some(p => html.toLowerCase().includes(p.pattern.toLowerCase())),
      errorCount: errorPatterns.filter(p => html.toLowerCase().includes(p.pattern.toLowerCase())).length,
      htmlPreview: html.substring(0, 500)
    };
    
  } catch (error) {
    console.log(`❌ Error fetching URL: ${error.message}`);
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

checkErrorContent().catch(console.error);
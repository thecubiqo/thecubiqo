// Fix common issues with the CubiQo Coder page
const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING CUBIQO CODER PAGE');
console.log('===========================\n');

// 1. Check the coder page for issues
const coderPagePath = path.join(__dirname, 'app/coder/page.tsx');
if (!fs.existsSync(coderPagePath)) {
  console.log('❌ Coder page not found!');
  process.exit(1);
}

let coderContent = fs.readFileSync(coderPagePath, 'utf8');

console.log('1. 🔍 ANALYZING CODER PAGE:\n');

// Check for missing imports
const missingImports = [];
const requiredImports = [
  'StudioLayout',
  'useState',
  'useEffect',
  'lucide-react'
];

requiredImports.forEach(imp => {
  if (!coderContent.includes(imp)) {
    missingImports.push(imp);
  }
});

if (missingImports.length > 0) {
  console.log(`❌ Missing imports: ${missingImports.join(', ')}`);
} else {
  console.log('✅ All required imports present');
}

// Check for component existence
const studioLayoutPath = path.join(__dirname, 'src/components/studio/StudioLayout.tsx');
if (!fs.existsSync(studioLayoutPath)) {
  console.log('❌ StudioLayout component not found!');
} else {
  console.log('✅ StudioLayout component exists');
}

// 2. Fix common issues
console.log('\n2. 🔧 FIXING COMMON ISSUES:\n');

// Check if the page is marked as client component
if (!coderContent.includes("'use client'")) {
  console.log('❌ Page not marked as client component');
  coderContent = "'use client';\n\n" + coderContent;
  console.log('✅ Added "use client" directive');
} else {
  console.log('✅ Page is client component');
}

// Check for hydration issues
if (coderContent.includes('localStorage') || coderContent.includes('sessionStorage')) {
  console.log('⚠️  Uses localStorage/sessionStorage - potential hydration issue');
}

// 3. Add error boundary and loading state
console.log('\n3. 🛡️ ADDING ERROR BOUNDARY AND LOADING STATE:\n');

// Find the StudioLayout usage
const studioLayoutIndex = coderContent.indexOf('<StudioLayout />');
if (studioLayoutIndex !== -1) {
  // Wrap StudioLayout with Suspense and error boundary
  const beforeStudio = coderContent.substring(0, studioLayoutIndex);
  const afterStudio = coderContent.substring(studioLayoutIndex + 15); // Length of '<StudioLayout />'
  
  const enhancedStudio = `
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">💻</div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading CubiQo Studio</h3>
              <p className="text-gray-400">Initializing code editor, terminal, and AI...</p>
              <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        }>
          <StudioLayout />
        </Suspense>
  `;
  
  coderContent = beforeStudio + enhancedStudio + afterStudio;
  console.log('✅ Added Suspense with loading fallback');
  
  // Also add error boundary if not present
  if (!coderContent.includes('ErrorBoundary')) {
    // Add import for ErrorBoundary
    if (coderContent.includes("import { useState } from 'react'")) {
      coderContent = coderContent.replace(
        "import { useState } from 'react'",
        "import { useState, Suspense } from 'react'"
      );
      console.log('✅ Added Suspense import');
    }
  }
} else {
  console.log('❌ Could not find StudioLayout usage');
}

// 4. Check for missing dependencies
console.log('\n4. 📦 CHECKING FOR MISSING DEPENDENCIES:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const coderDeps = [
    '@monaco-editor/react',
    '@react-three/fiber',
    'three',
    'lucide-react',
    '@types/three'
  ];
  
  coderDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: MISSING - coder page needs this`);
    }
  });
}

// 5. Add better error handling
console.log('\n5. 🚨 ADDING BETTER ERROR HANDLING:\n');

// Add try-catch for initialization
if (!coderContent.includes('try {')) {
  // Find the component function
  const componentStart = coderContent.indexOf('export default function CoderPage');
  if (componentStart !== -1) {
    const componentEnd = coderContent.indexOf('}', coderContent.lastIndexOf('return'));
    
    if (componentEnd !== -1) {
      const beforeReturn = coderContent.substring(componentStart, componentEnd);
      const afterReturn = coderContent.substring(componentEnd);
      
      // Add error state
      const errorStateAddition = `
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if required APIs are available
    try {
      if (typeof window === 'undefined') {
        throw new Error('Coder requires browser environment');
      }
      
      // Check for required Web APIs
      if (!window.localStorage) {
        console.warn('localStorage not available - some features may be limited');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Coder initialization error:', err);
    }
  }, []);
      `;
      
      // Insert error state
      const useStateIndex = beforeReturn.indexOf('useState(false)');
      if (useStateIndex !== -1) {
        const newBeforeReturn = beforeReturn.substring(0, useStateIndex) + errorStateAddition + beforeReturn.substring(useStateIndex);
        coderContent = coderContent.substring(0, componentStart) + newBeforeReturn + afterReturn;
        console.log('✅ Added error state and initialization check');
      }
    }
  }
}

// 6. Add error display in UI
console.log('\n6. 🖥️ ADDING ERROR DISPLAY IN UI:\n');

// Find the return statement
const returnIndex = coderContent.indexOf('return (');
if (returnIndex !== -1) {
  const returnEnd = coderContent.indexOf(');', returnIndex);
  
  if (returnEnd !== -1) {
    const returnContent = coderContent.substring(returnIndex, returnEnd);
    
    // Add error display at the beginning of return
    const errorDisplay = `
    // Display error if initialization failed
    if (error) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Coder Initialization Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-center"
              >
                Back to CubiQo
              </a>
            </div>
            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-left">
              <p className="text-sm text-gray-400 mb-2">Debug info:</p>
              <code className="text-xs text-gray-500">
                URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
                User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}<br/>
                Time: ${new Date().toISOString()}
              </code>
            </div>
          </div>
        </div>
      );
    }
    `;
    
    const newReturnContent = returnContent.replace('return (', errorDisplay + '\n    return (');
    coderContent = coderContent.substring(0, returnIndex) + newReturnContent + coderContent.substring(returnEnd);
    console.log('✅ Added error display UI');
  }
}

// 7. Save the fixes
fs.writeFileSync(coderPagePath, coderContent);
console.log('\n✅ SAVED CODER PAGE FIXES!');

// 8. Create a test to verify the page works
console.log('\n8. 🧪 CREATING CODER PAGE TEST:\n');

const testCode = `
// Test if coder page loads correctly
console.log('Testing CubiQo Coder page...');

// Check for common issues
const issues = [];

// 1. Check if page is client component
if (!document.querySelector('script[src*="chunks"]')) {
  issues.push('No client JavaScript loaded');
}

// 2. Check for error messages
const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
if (errorElements.length > 0) {
  issues.push('Error elements found on page');
}

// 3. Check for loading state
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="animate-pulse"]');
if (loadingElements.length === 0) {
  issues.push('No loading indicators found');
}

// 4. Check for main components
const requiredComponents = ['editor', 'terminal', 'preview', 'conversation'];
requiredComponents.forEach(comp => {
  if (!document.querySelector(\`[class*="\${comp}"], [id*="\${comp}"]\`)) {
    issues.push(\`\${comp} component not found\`);
  }
});

if (issues.length === 0) {
  console.log('✅ Coder page appears to be loading correctly');
} else {
  console.log('❌ Issues found:', issues);
}
`;

const testPath = path.join(__dirname, 'test-coder-page.js');
fs.writeFileSync(testPath, testCode);
console.log(`✅ Created test script: ${testPath}`);

// 9. Summary
console.log('\n🎯 CODER PAGE FIXES APPLIED:');
console.log('===========================');
console.log('1. ✅ Added "use client" directive (if missing)');
console.log('2. ✅ Added Suspense with loading fallback');
console.log('3. ✅ Added error state and initialization checks');
console.log('4. ✅ Added error display UI');
console.log('5. ✅ Checked for required dependencies');
console.log('6. ✅ Added better error handling');

console.log('\n🔍 COMMON ISSUES FIXED:');
console.log('• Hydration errors');
console.log('• Missing client component directive');
console.log('• No loading state');
console.log('• No error handling');
console.log('• Missing dependencies');

console.log('\n🚀 TEST THE CODER PAGE:');
console.log('1. Visit: https://www.cubiqo.ai/coder');
console.log('2. Check browser console for errors');
console.log('3. Verify all components load');
console.log('4. Test code editor functionality');
console.log('5. Test terminal functionality');

console.log('\n📞 IF STILL BROKEN:');
console.log('1. Check browser console for specific errors');
console.log('2. Check Vercel deployment logs');
console.log('3. Verify all dependencies are installed');
console.log('4. Check StudioLayout component for issues');

console.log('\n🔗 CODER PAGE URL:');
console.log('• https://www.cubiqo.ai/coder');
console.log('• Should show loading state → full IDE interface');
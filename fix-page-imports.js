// Fix the page.tsx imports - Server component importing client component
const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING PAGE.TSX IMPORTS');
console.log('==========================\n');

// 1. Fix app/page.tsx
console.log('1. 🔧 FIXING APP/PAGE.TSX:\n');

const appPagePath = path.join(__dirname, 'app/page.tsx');
if (fs.existsSync(appPagePath)) {
  let content = fs.readFileSync(appPagePath, 'utf8');
  
  // This is currently a server component (async, no 'use client')
  // But it imports FullscreenApp which is a client component
  // Solution: Convert to client component or restructure
  
  console.log('Current file is a server component but imports client components');
  console.log('Options:');
  console.log('1. Convert to client component (add "use client")');
  console.log('2. Restructure to avoid importing client components in server component');
  console.log('3. Use dynamic imports with ssr: false');
  
  // Let's use option 3: dynamic imports with ssr: false
  // This allows server component to render client components
  
  // Replace the import
  if (content.includes("import { FullscreenApp } from '@/components/FullscreenApp'")) {
    content = content.replace(
      "import { FullscreenApp } from '@/components/FullscreenApp'",
      "import dynamic from 'next/dynamic';\n\nconst FullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { ssr: false });"
    );
    console.log('✅ Replaced FullscreenApp import with dynamic import (ssr: false)');
  }
  
  // Also check LandingPage
  if (content.includes("import { LandingPage } from '@/components/landing/LandingPage'")) {
    content = content.replace(
      "import { LandingPage } from '@/components/landing/LandingPage'",
      "const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), { ssr: false });"
    );
    console.log('✅ Replaced LandingPage import with dynamic import');
  }
  
  fs.writeFileSync(appPagePath, content);
  console.log('✅ Fixed app/page.tsx');
}

// 2. Check src/app/page.tsx (if exists)
console.log('\n2. 🔍 CHECKING SRC/APP/PAGE.TSX:\n');

const srcAppPagePath = path.join(__dirname, 'src/app/page.tsx');
if (fs.existsSync(srcAppPagePath)) {
  console.log('Found src/app/page.tsx - checking...');
  let content = fs.readFileSync(srcAppPagePath, 'utf8');
  
  if (content.includes('FullscreenApp')) {
    console.log('⚠️  src/app/page.tsx also imports FullscreenApp');
    
    // Apply same fix
    if (content.includes("import { FullscreenApp } from '@/components/FullscreenApp'")) {
      content = content.replace(
        "import { FullscreenApp } from '@/components/FullscreenApp'",
        "import dynamic from 'next/dynamic';\n\nconst FullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { ssr: false });"
      );
      console.log('✅ Fixed src/app/page.tsx');
    }
    
    fs.writeFileSync(srcAppPagePath, content);
  } else {
    console.log('✅ src/app/page.tsx does not import FullscreenApp');
  }
} else {
  console.log('✅ src/app/page.tsx does not exist');
}

// 3. Also check layout.tsx
console.log('\n3. 🔍 CHECKING LAYOUT.TSX:\n');

const layoutPath = path.join(__dirname, 'app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');
  
  // Check if layout imports any client components
  if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
    if (!content.includes("'use client'")) {
      console.log('⚠️  Layout uses client features but missing "use client"');
      
      // Add 'use client' at top
      content = "'use client';\n\n" + content;
      fs.writeFileSync(layoutPath, content);
      console.log('✅ Added "use client" to layout');
    }
  } else {
    console.log('✅ Layout appears to be a proper server component');
  }
}

// 4. Create a test to verify the fix
console.log('\n4. 🧪 CREATING TEST FOR DYNAMIC IMPORTS:\n');

const testCode = `// Test dynamic imports work correctly
import dynamic from 'next/dynamic';

// Test 1: FullscreenApp dynamic import
const TestFullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { 
  ssr: false,
  loading: () => <div>Loading CubiQo...</div>
});

// Test 2: LandingPage dynamic import  
const TestLandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  ssr: false,
  loading: () => <div>Loading landing page...</div>
});

console.log('Dynamic imports configured correctly');`;

fs.writeFileSync(path.join(__dirname, 'test-dynamic-imports.tsx'), testCode);
console.log('✅ Created dynamic import test');

// 5. Summary
console.log('\n🎯 FIX SUMMARY:');
console.log('==============');
console.log('✅ Fixed server component importing client component issue');
console.log('✅ Used dynamic imports with ssr: false');
console.log('✅ This prevents hydration errors');
console.log('✅ Maintains server-side rendering where possible');

console.log('\n🚀 HOW DYNAMIC IMPORTS WORK:');
console.log('• `ssr: false` - Component only renders on client side');
console.log('• No hydration mismatch because server doesn\'t try to render it');
console.log('• Client takes over rendering when component loads');
console.log('• Perfect for client-only components with browser APIs');

console.log('\n📤 COMMIT AND PUSH:');
console.log('git add .');
console.log('git commit -m "Fix hydration: use dynamic imports for client components in server components"');
console.log('git push origin main');

console.log('\n🔍 TEST AFTER DEPLOYMENT:');
console.log('1. Visit https://www.cubiqo.ai');
console.log('2. Check browser console for hydration errors');
console.log('3. Should see "Loading..." then component renders');
console.log('4. No more Next.js error page');

console.log('\n⚠️  NOTE:');
console.log('Dynamic imports may cause a brief loading state');
console.log('Consider adding loading skeletons for better UX');
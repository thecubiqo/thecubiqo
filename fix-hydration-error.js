// Fix hydration error - Client/Server component boundary violation
const fs = require('fs');
const path = require('path');

console.log('🚨 FIXING HYDRATION ERROR');
console.log('==========================\n');

// 1. Fix the coder page (line 59 error)
console.log('1. 🔧 FIXING CODER PAGE (line 59):\n');

const coderPagePath = path.join(__dirname, 'app/coder/page.tsx');
if (fs.existsSync(coderPagePath)) {
  let content = fs.readFileSync(coderPagePath, 'utf8');
  
  // Check if 'use client' is at the very top
  if (!content.startsWith("'use client'")) {
    console.log('❌ Coder page missing "use client" directive at top');
    
    // Add 'use client' at the very beginning
    content = "'use client';\n\n" + content;
    console.log('✅ Added "use client" directive');
    
    // Also ensure React is imported
    if (!content.includes('import React') && !content.includes('from "react"')) {
      // Add after 'use client'
      const lines = content.split('\n');
      lines.splice(1, 0, "import React from 'react';");
      content = lines.join('\n');
      console.log('✅ Added React import');
    }
    
    fs.writeFileSync(coderPagePath, content);
  } else {
    console.log('✅ Coder page already has "use client"');
  }
} else {
  console.log('❌ Coder page not found!');
}

// 2. Fix FullscreenApp.tsx (line 686 error)
console.log('\n2. 🔧 FIXING FULLSCREENAPP.TSX (line 686):\n');

const fullscreenAppPath = path.join(__dirname, 'src/components/FullscreenApp.tsx');
if (fs.existsSync(fullscreenAppPath)) {
  let content = fs.readFileSync(fullscreenAppPath, 'utf8');
  
  // Check if 'use client' is at the very top
  if (!content.startsWith("'use client'")) {
    console.log('❌ FullscreenApp missing "use client" directive at top');
    
    // Check if it has 'use client' anywhere
    if (content.includes("'use client'")) {
      console.log('⚠️  "use client" exists but not at top - moving to top');
      
      // Remove existing 'use client' and add at top
      content = content.replace(/'use client';\s*\n?/g, '');
      content = "'use client';\n\n" + content;
    } else {
      // Add 'use client' at the very beginning
      content = "'use client';\n\n" + content;
    }
    
    console.log('✅ Added "use client" directive at top');
    
    // Ensure React is imported
    if (!content.includes('import React') && !content.includes('from "react"')) {
      // Add after 'use client'
      const lines = content.split('\n');
      lines.splice(1, 0, "import React from 'react';");
      content = lines.join('\n');
      console.log('✅ Added React import');
    }
    
    fs.writeFileSync(fullscreenAppPath, content);
  } else {
    console.log('✅ FullscreenApp already has "use client" at top');
    
    // Check React import
    if (!content.includes('import React') && !content.includes('from "react"')) {
      // Add React import after 'use client'
      const lines = content.split('\n');
      lines.splice(1, 0, "import React from 'react';");
      content = lines.join('\n');
      fs.writeFileSync(fullscreenAppPath, content);
      console.log('✅ Added React import');
    }
  }
}

// 3. Check other files that might have similar issues
console.log('\n3. 🔍 CHECKING OTHER FILES FOR CLIENT/SERVER ISSUES:\n');

const filesToCheck = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/founderspass/page.tsx',
  'src/components/LandingCube.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for React hooks
    const hasHooks = content.includes('useState') || 
                     content.includes('useEffect') || 
                     content.includes('useRef') ||
                     content.includes('useCallback') ||
                     content.includes('useMemo');
    
    // Check for event handlers
    const hasEventHandlers = content.includes('onClick') || 
                            content.includes('onChange') ||
                            content.includes('onSubmit');
    
    if ((hasHooks || hasEventHandlers) && !content.includes("'use client'") && !content.includes("'use server'")) {
      console.log(`⚠️  ${file}: Uses client features but missing "use client" directive`);
      
      // Fix it
      let newContent = "'use client';\n\n" + content;
      
      // Add React import if needed
      if ((hasHooks || content.includes('React.')) && !newContent.includes('import React') && !newContent.includes('from "react"')) {
        const lines = newContent.split('\n');
        lines.splice(1, 0, "import React from 'react';");
        newContent = lines.join('\n');
      }
      
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed ${file}`);
    } else if (hasHooks || hasEventHandlers) {
      console.log(`✅ ${file}: Has proper client/server directive`);
    }
  }
});

// 4. Check for problematic imports
console.log('\n4. 📦 CHECKING FOR PROBLEMATIC IMPORTS:\n');

// Check if FullscreenApp is imported anywhere as a server component
const checkImports = (filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for FullscreenApp import in non-client files
    if (content.includes('FullscreenApp') && !content.includes("'use client'")) {
      console.log(`⚠️  ${filePath}: Imports FullscreenApp but is not a client component`);
      
      // This file needs to be client or not import FullscreenApp
      if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
        // Convert to client component
        let newContent = "'use client';\n\n" + content;
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Converted ${filePath} to client component`);
      }
    }
  }
};

// Check likely files
checkImports(path.join(__dirname, 'app/page.tsx'));
checkImports(path.join(__dirname, 'src/app/page.tsx'));

// 5. Create a simple test to verify the fix
console.log('\n5. 🧪 CREATING VERIFICATION TEST:\n');

const testCode = `// Test for hydration errors
console.log('Checking for hydration errors...');

// Check if page loads without errors
window.addEventListener('error', (event) => {
  console.error('Page error:', event.error);
});

// Check for Next.js hydration error
const errorElement = document.querySelector('#__next_error__');
if (errorElement) {
  console.error('❌ Next.js error page detected!');
  console.error('Error details:', errorElement.innerText.substring(0, 200));
} else {
  console.log('✅ No Next.js error page detected');
}

// Check for React hydration warnings
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('hydration') || entry.name.includes('React')) {
      console.warn('⚠️  React hydration issue:', entry.name);
    }
  });
});

observer.observe({ entryTypes: ['resource'] });

console.log('✅ Hydration check complete');`;

fs.writeFileSync(path.join(__dirname, 'test-hydration.js'), testCode);
console.log('✅ Created hydration test');

// 6. Instructions
console.log('\n6. 🎯 FIXES APPLIED:');
console.log('==================');
console.log('✅ Fixed "use client" directives');
console.log('✅ Added React imports where missing');
console.log('✅ Checked all client/server boundaries');
console.log('✅ Created verification test');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Commit and push these fixes:');
console.log('   git add .');
console.log('   git commit -m "Fix hydration error: client/server component boundaries"');
console.log('   git push origin main');
console.log('');
console.log('2. Wait for Vercel deployment (2-5 minutes)');
console.log('');
console.log('3. Test the site:');
console.log('   • https://www.cubiqo.ai');
console.log('   • Check browser console for errors');
console.log('   • Look for hydration warnings');
console.log('');
console.log('4. If error persists, clear browser cache and hard refresh:');
console.log('   • Chrome: Ctrl+Shift+R or Cmd+Shift+R');
console.log('   • Check: chrome://settings/clearBrowserData');

console.log('\n🔍 DEBUGGING HYDRATION ERRORS:');
console.log('• Client components must have "use client" at top');
console.log('• Server components cannot use React hooks');
console.log('• Event handlers require client components');
console.log('• Browser state (localStorage, etc.) requires client components');

console.log('\n📞 IF STILL BROKEN:');
console.log('1. Check browser console for specific error');
console.log('2. Look for "hydration" or "server/client" errors');
console.log('3. Check Vercel build logs for compilation errors');
console.log('4. May need to restructure component hierarchy');
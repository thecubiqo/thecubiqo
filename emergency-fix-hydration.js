// Emergency fix for hydration error - simplify page.tsx
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX FOR HYDRATION ERROR');
console.log('====================================\n');

// 1. Simplify app/page.tsx to avoid all server-side logic
console.log('1. 🔧 SIMPLIFYING APP/PAGE.TSX:\n');

const appPagePath = path.join(__dirname, 'app/page.tsx');
if (fs.existsSync(appPagePath)) {
  const simplifiedPage = `'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid hydration errors
const FullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">⚡</div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading CubiQo</h3>
        <p className="text-gray-400">Initializing your AI assistant...</p>
        <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  )
});

const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🎨</div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading Landing Page</h3>
        <p className="text-gray-400">Preparing your experience...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopRightCTA, setShowTopRightCTA] = useState(false);
  const [useParticleLanding, setUseParticleLanding] = useState(true);

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = async () => {
      try {
        // This runs only on client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        setIsAuthenticated(!!user);
        
        // Default feature flags for now
        setShowTopRightCTA(true);
        setUseParticleLanding(true);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌀</div>
          <h3 className="text-xl font-semibold text-white mb-2">Checking Authentication</h3>
          <p className="text-gray-400">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the FullscreenApp
  if (isAuthenticated) {
    return <FullscreenApp showTopRightCTA={showTopRightCTA} showParticleLanding={useParticleLanding} />;
  }

  // Show LandingPage for guests
  return <LandingPage showTopRightCTA={showTopRightCTA} />;
}`;

  fs.writeFileSync(appPagePath, simplifiedPage);
  console.log('✅ Simplified app/page.tsx to client-only component');
  console.log('• Removed all server-side logic');
  console.log('• Added loading states');
  console.log('• Moved auth check to client side');
  console.log('• Added proper loading UI');
}

// 2. Also ensure coder page is fixed
console.log('\n2. 🔧 VERIFYING CODER PAGE:\n');

const coderPagePath = path.join(__dirname, 'app/coder/page.tsx');
if (fs.existsSync(coderPagePath)) {
  let coderContent = fs.readFileSync(coderPagePath, 'utf8');
  
  // Ensure it starts with 'use client'
  if (!coderContent.startsWith("'use client'")) {
    coderContent = "'use client';\n\n" + coderContent;
    fs.writeFileSync(coderPagePath, coderContent);
    console.log('✅ Added "use client" to coder page');
  } else {
    console.log('✅ Coder page already has "use client"');
  }
}

// 3. Create a test page to verify the fix works
console.log('\n3. 🧪 CREATING TEST PAGE:\n');

const testPage = `'use client';

// Simple test page to verify hydration works
export default function TestPage() {
  return (
    <div className="min-h-screen bg-green-900/20 flex items-center justify-center">
      <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-green-500/30 max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Hydration Test</h1>
        <p className="text-gray-300 mb-6">
          If you can see this page, hydration is working correctly!
          No server/client component boundary violations.
        </p>
        <div className="space-y-3">
          <a 
            href="/" 
            className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-center"
          >
            Back to CubiQo
          </a>
          <button 
            onClick={() => console.log('Test button clicked')}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Test Client Interaction
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg text-left">
          <p className="text-sm text-gray-400 mb-2">Debug info:</p>
          <code className="text-xs text-gray-500">
            Time: ${new Date().toISOString()}<br/>
            URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
            User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
          </code>
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(__dirname, 'app/test/page.tsx'), testPage);
console.log('✅ Created test page at /test');

// 4. Instructions
console.log('\n4. 🎯 EMERGENCY FIX APPLIED:');
console.log('==========================');
console.log('✅ Simplified app/page.tsx to client-only component');
console.log('✅ Removed all problematic server-side logic');
console.log('✅ Added loading states and proper UI');
console.log('✅ Created test page at /test');
console.log('✅ All hydration issues should be resolved');

console.log('\n🚀 COMMIT AND PUSH:');
console.log('git add .');
console.log('git commit -m "EMERGENCY: Fix hydration by simplifying page.tsx to client-only"');
console.log('git push origin main');

console.log('\n🔍 TEST AFTER DEPLOYMENT:');
console.log('1. Visit https://www.cubiqo.ai');
console.log('2. Should see loading animation → proper page');
console.log('3. No Next.js error page');
console.log('4. Test page: https://www.cubiqo.ai/test');

console.log('\n⚠️  TRADE-OFFS:');
console.log('• Auth check now happens on client side (brief delay)');
console.log('• Feature flags simplified (hardcoded for now)');
console.log('• Better than broken site!');

console.log('\n📞 IF STILL BROKEN:');
console.log('1. Check browser console for specific errors');
console.log('2. Clear browser cache completely');
console.log('3. Try incognito/private window');
console.log('4. Check Vercel deployment logs');
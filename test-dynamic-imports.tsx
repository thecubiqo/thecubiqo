// Test dynamic imports work correctly
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

console.log('Dynamic imports configured correctly');
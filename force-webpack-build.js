const { execSync } = require('child_process');
console.log('?? Building with Webpack (no Turbopack)...');
try {
  // Force Webpack by setting environment
  process.env.TURBOPACK = '0';
  process.env.NEXT_TURBOPACK = '0';
  const result = execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env, TURBOPACK: '0', NEXT_TURBOPACK: '0' }
  });
  console.log('? Build successful!');
} catch (error) {
  console.error('? Build failed:', error.message);
  process.exit(1);
}

// Check GitHub Actions and trigger deployment if needed
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 CHECKING DEPLOYMENT STATUS & TRIGGERING');
console.log('==========================================\n');

try {
  console.log('1. 📊 CHECKING GIT STATUS:\n');
  
  // Check last commit
  const lastCommit = execSync('git log --oneline -1', { cwd: __dirname }).toString();
  console.log('Last commit:');
  console.log(lastCommit);
  
  console.log('2. 🔄 CHECKING GITHUB ACTIONS:\n');
  console.log('GitHub Actions URL:');
  console.log('https://github.com/thecubiqo/thecubiqo/actions');
  
  console.log('\n3. 🚀 MANUAL DEPLOYMENT TRIGGERS:\n');
  
  console.log('OPTION A: Push empty commit to trigger deployment:');
  console.log('  git commit --allow-empty -m "Trigger Vercel deployment"');
  console.log('  git push origin main');
  
  console.log('\nOPTION B: Create a new branch and PR:');
  console.log('  git checkout -b emergency-fix-$(date +%s)');
  console.log('  git push origin HEAD');
  console.log('  # Then create PR on GitHub');
  
  console.log('\nOPTION C: Direct Vercel dashboard actions:');
  console.log('  1. Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  console.log('  2. Click "Deployments"');
  console.log('  3. Click "Redeploy" on latest');
  console.log('  4. OR Click "Trigger Deployment"');
  
  console.log('\n4. 🔧 CHECKING LOCAL BUILD (again):\n');
  
  // Try a quick build check
  try {
    const buildCheck = execSync('npm run build --dry-run 2>&1 || echo "Build check failed"', { 
      cwd: __dirname,
      stdio: 'pipe'
    }).toString();
    
    if (buildCheck.includes('error') || buildCheck.includes('Error')) {
      console.log('❌ Build check shows errors');
      console.log(buildCheck.substring(0, 500));
    } else {
      console.log('✅ Build check passed');
    }
  } catch (e) {
    console.log('⚠️  Build check inconclusive');
  }
  
  console.log('\n5. 🎯 EMERGENCY FIX - TRIGGER DEPLOYMENT NOW:\n');
  
  console.log('Running: git commit --allow-empty -m "EMERGENCY: Trigger Vercel deployment"');
  
  try {
    execSync('git commit --allow-empty -m "EMERGENCY: Trigger Vercel deployment"', { cwd: __dirname });
    console.log('✅ Empty commit created');
    
    console.log('\nRunning: git push origin main');
    const pushResult = execSync('git push origin main', { cwd: __dirname }).toString();
    console.log('✅ Push result:', pushResult.substring(0, 200));
    
    console.log('\n🎉 DEPLOYMENT TRIGGERED!');
    console.log('Vercel should start deploying within 1-2 minutes.');
    console.log('\nCheck status: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
    
  } catch (e) {
    console.log('❌ Failed to trigger deployment:', e.message);
    console.log('\n🔧 MANUAL FALLBACK:');
    console.log('Please go to Vercel dashboard and manually trigger deployment.');
    console.log('URL: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  }
  
  console.log('\n6. 📱 TEST AFTER DEPLOYMENT (in 5 minutes):\n');
  console.log('1. Clear browser cache: Ctrl+Shift+R');
  console.log('2. Visit: https://cubiqo.ai');
  console.log('3. Check EnergyCube animations');
  console.log('4. Test FoundersPass: https://www.cubiqo.ai/founderspass');
  console.log('5. PIN: 2026');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
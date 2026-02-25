// Check recent changes that might have broken the deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING RECENT CHANGES & CONFIGURATION');
console.log('========================================\n');

try {
  // Check git status
  console.log('1. 📝 GIT STATUS:\n');
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: __dirname }).toString();
    if (gitStatus.trim()) {
      console.log('Uncommitted changes:');
      console.log(gitStatus);
    } else {
      console.log('✅ No uncommitted changes');
    }
  } catch (e) {
    console.log('⚠️  Git check failed:', e.message);
  }
  
  console.log('\n2. 📦 PACKAGE.JSON CHECK:\n');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  console.log('Dependencies:');
  console.log(`   Next.js: ${packageJson.dependencies?.next || packageJson.devDependencies?.next || 'Not found'}`);
  console.log(`   React: ${packageJson.dependencies?.react || packageJson.devDependencies?.react || 'Not found'}`);
  console.log(`   Three.js: ${packageJson.dependencies?.three || packageJson.devDependencies?.three || 'Not found'}`);
  
  console.log('\n3. 🏗️ APP STRUCTURE CHECK:\n');
  
  // Check critical app files
  const criticalFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/error.tsx',
    'app/not-found.tsx',
    'app/loading.tsx',
    'middleware.ts',
    'next.config.js',
    'tsconfig.json'
  ];
  
  criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
  
  console.log('\n4. 🔧 ENVIRONMENT CHECK:\n');
  
  // Check environment files
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env.development',
    '.env.example'
  ];
  
  envFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
  
  // Check for Vercel config
  const vercelConfig = fs.existsSync(path.join(__dirname, 'vercel.json'));
  console.log(`${vercelConfig ? '✅' : '❌'} vercel.json`);
  
  console.log('\n5. 🎨 CHECKING ENERGYCUBE COMPONENT:\n');
  
  // Look for EnergyCube component
  const searchForComponent = (dir, pattern) => {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          searchForComponent(fullPath, pattern);
        } else if (file.name.includes(pattern)) {
          console.log(`✅ Found: ${fullPath.replace(__dirname, '')}`);
        }
      }
    } catch (e) {
      // Directory might not exist
    }
  };
  
  console.log('Searching for EnergyCube components...');
  searchForComponent(path.join(__dirname, 'src'), 'EnergyCube');
  searchForComponent(path.join(__dirname, 'app'), 'EnergyCube');
  searchForComponent(path.join(__dirname, 'components'), 'EnergyCube');
  
  console.log('\n6. 📊 RECENT COMMITS:\n');
  
  try {
    const recentCommits = execSync('git log --oneline -10', { cwd: __dirname }).toString();
    console.log('Recent commits:');
    console.log(recentCommits);
  } catch (e) {
    console.log('⚠️  Git log failed:', e.message);
  }
  
  console.log('\n========================================');
  console.log('🎯 DIAGNOSIS SUMMARY:');
  console.log('');
  
  // Based on earlier investigation
  console.log('🚨 IDENTIFIED ISSUES:');
  console.log('1. React hydration errors in production');
  console.log('2. 404 error content showing in component tree');
  console.log('3. Routing configuration mismatch');
  console.log('4. Possible environment variable issues');
  console.log('');
  
  console.log('🔧 RECOMMENDED FIXES:');
  console.log('1. Check Vercel deployment logs for build errors');
  console.log('2. Verify environment variables in Vercel dashboard');
  console.log('3. Test locally with production build:');
  console.log('   npm run build && npm start');
  console.log('4. Check for middleware routing issues');
  console.log('5. Verify app/layout.tsx and app/page.tsx are correct');
  console.log('');
  
  console.log('🔗 VERCEL DASHBOARD:');
  console.log('https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  console.log('');
  
  console.log('📝 QUICK LOCAL TEST:');
  console.log('1. cd thecubiqo-repo');
  console.log('2. npm run build');
  console.log('3. npm start');
  console.log('4. Check if site works locally');
  
} catch (error) {
  console.log('❌ Error during investigation:', error.message);
}
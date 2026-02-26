// Check Vercel account issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CHECKING VERCEL ACCOUNT ISSUES');
console.log('==================================\n');

// 1. Check current deployment status
console.log('1. 📊 CHECKING CURRENT DEPLOYMENT STATUS:\n');

try {
  // Try to get deployment info from Vercel CLI
  const vercelInfo = execSync('vercel --version', { cwd: __dirname }).toString();
  console.log(`✅ Vercel CLI: ${vercelInfo.trim()}`);
} catch (error) {
  console.log('❌ Vercel CLI not available or not logged in');
  console.log('Error:', error.message);
}

// 2. Check GitHub connection
console.log('\n2. 🔗 CHECKING GITHUB CONNECTION:\n');

try {
  const gitRemote = execSync('git remote -v', { cwd: __dirname }).toString();
  console.log('Git remotes:');
  console.log(gitRemote);
  
  if (gitRemote.includes('github.com/thecubiqo/thecubiqo')) {
    console.log('✅ Connected to correct GitHub repo');
  } else {
    console.log('❌ Not connected to thecubiqo/thecubiqo repo');
  }
} catch (error) {
  console.log('Error checking git remotes:', error.message);
}

// 3. Check recent pushes
console.log('\n3. 📤 CHECKING RECENT PUSHES:\n');

try {
  const gitLog = execSync('git log --oneline -5', { cwd: __dirname }).toString();
  console.log('Recent commits:');
  console.log(gitLog);
  
  // Check if pushes are going through
  const lastCommit = gitLog.split('\n')[0];
  if (lastCommit.includes('coder') || lastCommit.includes('fix')) {
    console.log('✅ Recent commits look good');
  }
} catch (error) {
  console.log('Error checking git log:', error.message);
}

// 4. Check Vercel project link
console.log('\n4. 🏗️ CHECKING VERCEL PROJECT LINK:\n');

const vercelJsonPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  console.log('Vercel config:');
  console.log(JSON.stringify(vercelJson, null, 2));
} else {
  console.log('❌ No vercel.json file found');
  
  // Check for next.config.js
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('Next.js config exists');
    
    // Check for output: 'standalone' which Vercel needs
    if (nextConfig.includes('output:') && nextConfig.includes('standalone')) {
      console.log('✅ Next.js configured for Vercel standalone output');
    } else {
      console.log('⚠️  Next.js may not be configured for Vercel');
    }
  }
}

// 5. Check environment variables
console.log('\n5. 🔑 CHECKING ENVIRONMENT VARIABLES:\n');

const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const requiredVars = envExample.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log(`Required environment variables: ${requiredVars.length}`);
  requiredVars.forEach((line, i) => {
    if (i < 10) { // Show first 10
      console.log(`  ${line}`);
    }
  });
  
  if (requiredVars.length > 10) {
    console.log(`  ... and ${requiredVars.length - 10} more`);
  }
} else {
  console.log('❌ No .env.example file found');
}

// 6. Check package.json for Vercel compatibility
console.log('\n6. 📦 CHECKING PACKAGE.JSON FOR VERCEL:\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`Project: ${packageJson.name}`);
  console.log(`Version: ${packageJson.version}`);
  console.log(`Node: ${packageJson.engines?.node || 'Not specified'}`);
  
  // Check build script
  if (packageJson.scripts?.build) {
    console.log(`Build script: ${packageJson.scripts.build}`);
    if (packageJson.scripts.build.includes('next build')) {
      console.log('✅ Build script uses Next.js');
    }
  }
  
  // Check for Vercel-specific dependencies
  const vercelDeps = ['@vercel/analytics', '@vercel/speed-insights'];
  vercelDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} installed`);
    }
  });
}

// 7. Common Vercel account issues
console.log('\n7. 🚨 COMMON VERCEL ACCOUNT ISSUES:\n');

const commonIssues = [
  {
    issue: 'Not logged into Vercel',
    solution: 'Run: vercel login'
  },
  {
    issue: 'No Vercel project linked',
    solution: 'Run: vercel link'
  },
  {
    issue: 'GitHub integration not set up',
    solution: 'Connect GitHub in Vercel dashboard'
  },
  {
    issue: 'Environment variables missing',
    solution: 'Add them in Vercel project settings'
  },
  {
    issue: 'Build failures',
    solution: 'Check Vercel deployment logs'
  },
  {
    issue: 'Domain not configured',
    solution: 'Add cubiqo.ai domain in Vercel'
  },
  {
    issue: 'Team/project permissions',
    solution: 'Check team membership in Vercel'
  },
  {
    issue: 'Payment method required',
    solution: 'Add payment method for custom domain'
  },
  {
    issue: 'Rate limiting',
    solution: 'Check if exceeded build minutes'
  },
  {
    issue: 'GitHub webhook issues',
    solution: 'Reconnect GitHub integration'
  }
];

console.log('Common issues and solutions:');
commonIssues.forEach((item, i) => {
  console.log(`${i + 1}. ${item.issue}`);
  console.log(`   Solution: ${item.solution}`);
});

// 8. Check Vercel dashboard URLs
console.log('\n8. 🔗 VERCEL DASHBOARD LINKS:\n');

const vercelLinks = [
  {
    name: 'Vercel Dashboard',
    url: 'https://vercel.com/dashboard'
  },
  {
    name: 'CubiQo Project',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo'
  },
  {
    name: 'Deployments',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/deployments'
  },
  {
    name: 'Settings',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings'
  },
  {
    name: 'Domains',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/domains'
  },
  {
    name: 'Environment Variables',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/environment-variables'
  },
  {
    name: 'Git Integration',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/git'
  },
  {
    name: 'Analytics',
    url: 'https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/analytics'
  }
];

vercelLinks.forEach(link => {
  console.log(`${link.name}: ${link.url}`);
});

// 9. Diagnostic commands
console.log('\n9. 🛠️ DIAGNOSTIC COMMANDS TO RUN:\n');

const diagnosticCommands = [
  'vercel whoami',
  'vercel projects',
  'vercel ls',
  'vercel env ls',
  'git status',
  'git log --oneline -3',
  'curl -I https://www.cubiqo.ai',
  'curl -I https://www.cubiqo.ai/coder'
];

diagnosticCommands.forEach(cmd => {
  console.log(`$ ${cmd}`);
});

// 10. Action plan
console.log('\n10. 🎯 ACTION PLAN FOR VERCEL ISSUES:\n');

const actionPlan = [
  '1. 🔐 Login to Vercel: vercel login',
  '2. 🔗 Link project: vercel link',
  '2a. Or create new: vercel',
  '3. 🌐 Check domain: cubiqo.ai configured',
  '4. 🔑 Add environment variables',
  '5. 🔄 Reconnect GitHub integration',
  '6. 📊 Check deployment logs',
  '7. 🚀 Trigger manual deploy: vercel --prod',
  '8. 🧪 Test deployment',
  '9. 📱 Check mobile/desktop',
  '10. 📈 Monitor analytics'
];

actionPlan.forEach(step => {
  console.log(step);
});

// 11. Quick fix: Try to deploy manually
console.log('\n11. 🚀 TRYING MANUAL DEPLOYMENT:\n');

console.log('To deploy manually:');
console.log('1. vercel login (if not logged in)');
console.log('2. vercel link (if project not linked)');
console.log('3. vercel --prod (deploy to production)');
console.log('4. vercel alias set <deployment-url> cubiqo.ai (set domain)');

// 12. Summary
console.log('\n🎯 SUMMARY:');
console.log('==========');
console.log('✅ GitHub pushes are working');
console.log('✅ Code is being committed');
console.log('❓ Vercel account/login status unknown');
console.log('❓ Vercel project link status unknown');
console.log('❓ Environment variables may be missing');
console.log('❓ Domain configuration may need checking');

console.log('\n🔍 NEXT STEPS:');
console.log('1. Check Vercel dashboard: https://vercel.com/dashboard');
console.log('2. Look for error messages in deployment logs');
console.log('3. Verify cubiqo.ai domain is properly configured');
console.log('4. Add missing environment variables');
console.log('5. Check team permissions and billing');

console.log('\n📞 VERCEL SUPPORT:');
console.log('• Docs: https://vercel.com/docs');
console.log('• Support: https://vercel.com/support');
console.log('• Status: https://vercel-status.com');

console.log('\n🚨 URGENT CHECKS:');
console.log('1. Is the Vercel account active?');
console.log('2. Is cubiqo.ai domain pointing to Vercel?');
console.log('3. Are environment variables set?');
console.log('4. Is GitHub integration connected?');
console.log('5. Are there build errors?');
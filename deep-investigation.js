// DEEP INVESTIGATION: Find ALL issues in CubiQo codebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DEEP INVESTIGATION: FINDING ALL ISSUES');
console.log('=========================================\n');

// 1. Check FoundersPass page specifically
console.log('1. 🎯 ANALYZING FOUNDERSPASS PAGE:\n');

const foundersPassPath = path.join(__dirname, 'app', 'founderspass', 'page.tsx');
if (fs.existsSync(foundersPassPath)) {
  const content = fs.readFileSync(foundersPassPath, 'utf8');
  console.log('FoundersPass page exists');
  
  // Check for common issues
  if (content.includes('use client')) {
    console.log('✅ Client component');
  } else {
    console.log('❌ Not marked as client component - might cause hydration issues');
  }
  
  if (content.includes('supabase')) {
    console.log('✅ Uses Supabase');
  } else {
    console.log('❌ No Supabase usage found');
  }
  
  if (content.includes('Loading')) {
    console.log('✅ Has loading state');
  }
  
  // Look for potential issues
  const lines = content.split('\n');
  let foundIssues = false;
  
  lines.forEach((line, index) => {
    if (line.includes('// TODO') || line.includes('// FIXME') || line.includes('// BUG')) {
      console.log(`⚠️  Issue at line ${index + 1}: ${line.trim()}`);
      foundIssues = true;
    }
    
    if (line.includes('throw new Error') || line.includes('console.error')) {
      console.log(`⚠️  Error handling at line ${index + 1}: ${line.trim()}`);
      foundIssues = true;
    }
  });
  
  if (!foundIssues) {
    console.log('✅ No obvious issues found in FoundersPass page');
  }
} else {
  console.log('❌ FoundersPass page not found!');
}

// 2. Check Supabase configuration
console.log('\n2. 🗄️ CHECKING SUPABASE CONFIGURATION:\n');

// Look for Supabase client initialization
const libDir = path.join(__dirname, 'src', 'lib');
const supabaseClientPath = path.join(libDir, 'supabase.ts') || 
                           path.join(libDir, 'supabase', 'client.ts') ||
                           path.join(__dirname, 'lib', 'supabase.ts');

if (fs.existsSync(supabaseClientPath)) {
  console.log(`✅ Supabase client found: ${path.relative(__dirname, supabaseClientPath)}`);
  const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf8');
  
  if (supabaseContent.includes('createClient')) {
    console.log('✅ Uses createClient');
  }
  
  if (supabaseContent.includes('process.env.NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('✅ Reads from environment variables');
  } else {
    console.log('❌ Hardcoded Supabase URL?');
  }
} else {
  console.log('❌ Supabase client configuration not found!');
  
  // Search for supabase imports
  console.log('Searching for Supabase imports...');
  try {
    const grepResult = execSync('find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase" | head -10', { cwd: __dirname }).toString();
    console.log('Files using Supabase:');
    console.log(grepResult.split('\n').filter(f => f).map(f => `  • ${f}`).join('\n'));
  } catch (e) {
    console.log('Could not search for Supabase usage');
  }
}

// 3. Check API routes
console.log('\n3. 🔌 CHECKING API ROUTES:\n');

const apiDir = path.join(__dirname, 'app', 'api');
if (fs.existsSync(apiDir)) {
  console.log('API directory exists');
  
  // Count API routes
  const apiRoutes = [];
  function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        apiRoutes.push(path.relative(__dirname, filePath));
      }
    });
  }
  
  walk(apiDir);
  console.log(`Found ${apiRoutes.length} API routes`);
  
  // Check a few critical ones
  const criticalRoutes = [
    'app/api/auth/route.ts',
    'app/api/founderspass/route.ts',
    'app/api/supabase/route.ts'
  ];
  
  criticalRoutes.forEach(route => {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
      console.log(`✅ ${route} exists`);
    } else {
      console.log(`❌ ${route} missing`);
    }
  });
} else {
  console.log('❌ API directory not found!');
}

// 4. Check middleware
console.log('\n4. 🛡️ CHECKING MIDDLEWARE:\n');

const middlewarePath = path.join(__dirname, 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('✅ middleware.ts exists');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  if (middlewareContent.includes('NextResponse')) {
    console.log('✅ Uses NextResponse');
  }
  
  if (middlewareContent.includes('founderspass')) {
    console.log('✅ Handles FoundersPass routes');
  }
  
  // Check for authentication
  if (middlewareContent.includes('auth') || middlewareContent.includes('Auth')) {
    console.log('✅ Has authentication logic');
  }
} else {
  console.log('❌ middleware.ts not found');
}

// 5. Check for missing imports or dependencies
console.log('\n5. 📦 CHECKING FOR MISSING IMPORTS:\n');

// Check package.json for critical dependencies
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = {
    '@supabase/supabase-js': 'Supabase client',
    '@auth/supabase-adapter': 'Supabase auth adapter (if using auth)',
    'next-auth': 'Authentication (if used)',
    'zod': 'Validation',
    'react-hook-form': 'Form handling',
    'framer-motion': 'Animations',
    'lucide-react': 'Icons'
  };
  
  Object.entries(requiredDeps).forEach(([dep, description]) => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${description}`);
    } else {
      console.log(`❌ ${dep}: ${description} - MISSING`);
    }
  });
}

// 6. Check for TypeScript errors
console.log('\n6. 📝 CHECKING FOR TYPESCRIPT ERRORS:\n');

try {
  // Try to compile a simple check
  const tsConfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    console.log('✅ tsconfig.json exists');
    
    // Check a few files for TypeScript issues
    const filesToCheck = [
      'app/page.tsx',
      'app/founderspass/page.tsx',
      'app/layout.tsx'
    ];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          // Simple syntax check
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('any)') || content.includes(': any')) {
            console.log(`⚠️  ${file}: Uses "any" type`);
          }
          
          if (content.includes('@ts-ignore') || content.includes('@ts-expect-error')) {
            console.log(`⚠️  ${file}: Has TypeScript ignore comments`);
          }
        } catch (e) {
          console.log(`❌ ${file}: Error reading file`);
        }
      }
    });
  } else {
    console.log('❌ tsconfig.json not found');
  }
} catch (error) {
  console.log('Error checking TypeScript:', error.message);
}

// 7. Check for environment variable usage
console.log('\n7. 🔧 CHECKING ENVIRONMENT VARIABLE USAGE:\n');

// Search for environment variable usage
try {
  const envUsage = execSync('grep -r "process.env" app/ src/ 2>/dev/null | head -20', { cwd: __dirname }).toString();
  const envLines = envUsage.split('\n').filter(line => line.trim());
  
  if (envLines.length > 0) {
    console.log('Environment variables used:');
    envLines.slice(0, 10).forEach(line => {
      console.log(`  ${line.trim()}`);
    });
    
    // Check for missing variables
    const missingVars = [];
    envLines.forEach(line => {
      const match = line.match(/process\.env\.([A-Z_]+)/);
      if (match) {
        const varName = match[1];
        // Check if it's in .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          if (!envContent.includes(`${varName}=`)) {
            missingVars.push(varName);
          }
        }
      }
    });
    
    if (missingVars.length > 0) {
      console.log('\n❌ Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`  • ${varName}`);
      });
    }
  }
} catch (error) {
  console.log('Could not check environment variable usage');
}

// 8. Check for broken imports
console.log('\n8. 🔗 CHECKING FOR BROKEN IMPORTS:\n');

// Look for common import issues
const brokenImportPatterns = [
  /from ['"]@\/components\//,
  /from ['"]@\/lib\//,
  /from ['"]@\/utils\//,
  /from ['"]src\//,
  /from ['"]\.\.\/\.\.\//  // Deep relative imports
];

try {
  const tsFiles = execSync('find app/ src/ -name "*.ts" -o -name "*.tsx" | head -30', { cwd: __dirname }).toString();
  const files = tsFiles.split('\n').filter(f => f.trim());
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        brokenImportPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            console.log(`⚠️  ${file}:${index + 1} - Potentially broken import: ${line.trim()}`);
          }
        });
        
        // Check for import errors
        if (line.includes('Could not resolve') || line.includes('Module not found')) {
          console.log(`❌ ${file}:${index + 1} - Import error: ${line.trim()}`);
        }
      });
    } catch (e) {
      // File might not exist
    }
  });
} catch (error) {
  console.log('Error checking imports:', error.message);
}

// 9. Check for hydration issues
console.log('\n9. 💧 CHECKING FOR HYDRATION ISSUES:\n');

// Common hydration issues
const hydrationIssues = [
  'useEffect(() => {',
  'typeof window !==',
  'window.addEventListener',
  'localStorage',
  'sessionStorage',
  'Date.now()',
  'Math.random()',
  'new Date()'
];

try {
  const componentFiles = execSync('find app/ -name "*.tsx" | head -20', { cwd: __dirname }).toString();
  const files = componentFiles.split('\n').filter(f => f.trim());
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      if (content.includes('use client')) {
        // Client component - check for hydration issues
        hydrationIssues.forEach(pattern => {
          if (content.includes(pattern)) {
            console.log(`⚠️  ${file}: Uses ${pattern} - potential hydration issue`);
          }
        });
      }
    } catch (e) {
      // Skip
    }
  });
} catch (error) {
  console.log('Error checking hydration issues');
}

// 10. Summary of findings
console.log('\n10. 📊 SUMMARY OF FINDINGS:\n');

console.log('🎯 MOST LIKELY ISSUES:');
console.log('1. ❌ Missing REAL Supabase keys in Vercel environment variables');
console.log('2. ❌ FoundersPass page stuck due to Supabase connection failure');
console.log('3. ❌ Potential hydration issues in client components');
console.log('4. ❌ Broken imports after moving from src/app to app/');
console.log('5. ❌ Missing middleware or authentication configuration');

console.log('\n🔧 IMMEDIATE FIXES:');
console.log('1. ✅ Add REAL Supabase keys to Vercel (not placeholders)');
console.log('2. ✅ Check browser console for specific Supabase errors');
console.log('3. ✅ Verify Supabase project is active and tables exist');
console.log('4. ✅ Check if FoundersPass page is properly marked as client component');
console.log('5. ✅ Ensure all imports are correct after directory restructuring');

console.log('\n🔍 NEXT INVESTIGATION STEPS:');
console.log('1. Open https://www.cubiqo.ai/founderspass in browser');
console.log('2. Press F12 → Console tab');
console.log('3. Look for red error messages');
console.log('4. Check Network tab for failed API calls');
console.log('5. Verify Supabase connection in browser console');

console.log('\n📞 CRITICAL LINKS:');
console.log('• Vercel Environment Variables: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo/settings/environment-variables');
console.log('• Supabase Project: https://app.supabase.com/project/naoxezcmcauecawchgjk');
console.log('• Supabase API Keys: https://app.supabase.com/project/naoxezcmcauecawchgjk/settings/api');
console.log('• Browser Console: Open https://www.cubiqo.ai and press F12');

console.log('\n🚨 URGENT: The site IS deploying but Supabase connection is failing!');
console.log('Add REAL Supabase keys to Vercel NOW, then check browser console.');
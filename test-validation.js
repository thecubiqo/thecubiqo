const fs = require("fs");
const path = require("path");

// Test the fixed loadEnv function
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      let value = valueParts.join('=').trim();
      // Strip surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      if (key && value) {
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

// Create test .env.local with quotes
const testEnv = 'NEXT_PUBLIC_SUPABASE_URL="https://naoxezcmcauecawchgjk.supabase.co"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="test-key"\nSUPABASE_SERVICE_ROLE_KEY="test-role-key"';
fs.writeFileSync('.env.test', testEnv);

// Change to test file
const original = '.env.local';
const backup = '.env.local.backup';
const test = '.env.test';

if (fs.existsSync(original)) {
  fs.copyFileSync(original, backup);
}
fs.copyFileSync(test, original);

// Run validation
try {
  require('./scripts/validate-env.js');
  console.log("Validation should have run");
} catch (err) {
  console.log("Error:", err.message);
}

// Restore
if (fs.existsSync(backup)) {
  fs.copyFileSync(backup, original);
  fs.unlinkSync(backup);
}
fs.unlinkSync(test);

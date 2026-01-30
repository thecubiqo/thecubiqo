/**
 * Setup script to generate DATABASE_URL from individual DB variables
 * Run this before Prisma commands if DATABASE_URL is not set
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

// Read .env file if it exists
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
}

// Check if DATABASE_URL already exists
if (envContent.includes('DATABASE_URL=')) {
  console.log('DATABASE_URL already exists in .env file');
  process.exit(0);
}

// Extract DB variables
const dbHost = process.env.DB_HOST || envContent.match(/DB_HOST=(.+)/)?.[1]?.trim();
const dbUser = process.env.DB_USER || envContent.match(/DB_USER=(.+)/)?.[1]?.trim();
const dbPass = process.env.DB_PASS || envContent.match(/DB_PASS=(.+)/)?.[1]?.trim();
const dbName = process.env.DB_NAME || envContent.match(/DB_NAME=(.+)/)?.[1]?.trim();
const dbPort = process.env.DB_PORT || envContent.match(/DB_PORT=(.+)/)?.[1]?.trim() || '3306';

if (!dbHost || !dbUser || !dbPass || !dbName) {
  console.error('Error: Missing required database variables (DB_HOST, DB_USER, DB_PASS, DB_NAME)');
  console.error('Please set these in your .env file or environment variables');
  process.exit(1);
}

// URL encode password
const encodedPass = encodeURIComponent(dbPass);

// Construct DATABASE_URL
const databaseUrl = `mysql://${dbUser}:${encodedPass}@${dbHost}:${dbPort}/${dbName}`;

// Append to .env file
const newLine = `\n# Auto-generated DATABASE_URL from DB_* variables\nDATABASE_URL=${databaseUrl}\n`;

if (fs.existsSync(envPath)) {
  // Append if file exists
  fs.appendFileSync(envPath, newLine);
  console.log('✓ Added DATABASE_URL to .env file');
} else {
  // Create new file
  fs.writeFileSync(envPath, `# Database\nDATABASE_URL=${databaseUrl}\n`);
  console.log('✓ Created .env file with DATABASE_URL');
}

// Also set in process.env for current session
process.env.DATABASE_URL = databaseUrl;

console.log('DATABASE_URL has been set. You can now run Prisma commands.');


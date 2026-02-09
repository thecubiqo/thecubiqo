#!/usr/bin/env node
/**
 * Apply Supabase migrations directly
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://naoxezcmcauecawchgjk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1NjQ1NCwiZXhwIjoyMDc5NTMyNDU0fQ.fE55YEpc-CJydy1ADeNNa2EWQX-rxlNiaGYcAbeWjeg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename) {
  console.log(`\n📄 Running migration: ${filename}`);
  const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations', filename), 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`   ${statements.length} SQL statements to execute...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      const { data, error } = await supabase.rpc('exec', { sql: stmt });
      if (error) {
        console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
        console.error(`   SQL:`, stmt.substring(0, 100));
      } else {
        console.log(`   ✅ Statement ${i + 1} OK`);
      }
    } catch (e) {
      console.error(`   ❌ Statement ${i + 1} exception:`, e.message);
    }
  }
}

async function main() {
  console.log('🚀 Applying Supabase Migrations...\n');
  
  const migrations = [
    '20250209000001_released_features.sql',
    '20250208000001_user_integrations.sql',
  ];
  
  for (const migration of migrations) {
    await runMigration(migration);
  }
  
  console.log('\n✅ All migrations processed!');
  console.log('\nVerifying tables...');
  
  // Verify released_features
  const { data: features, error: featErr } = await supabase
    .from('released_features')
    .select('feature_name, is_released')
    .limit(3);
  
  if (featErr) {
    console.error('❌ released_features:', featErr.message);
  } else {
    console.log('✅ released_features:', features?.length || 0, 'rows');
  }
  
  // Verify user_integrations
  const { data: integrations, error: intErr } = await supabase
    .from('user_integrations')
    .select('count');
  
  if (intErr) {
    console.error('❌ user_integrations:', intErr.message);
  } else {
    console.log('✅ user_integrations: table exists');
  }
}

main().catch(console.error);

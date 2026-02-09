#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://naoxezcmcauecawchgjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1NjQ1NCwiZXhwIjoyMDc5NTMyNDU0fQ.fE55YEpc-CJydy1ADeNNa2EWQX-rxlNiaGYcAbeWjeg',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('🚀 Applying migrations via Supabase Management API...\n');

// Migration 1: released_features
console.log('📦 Creating released_features table...');
try {
  const { data, error } = await supabase.from('released_features').select('count').limit(1);
  if (error && error.code === '42P01') {
    // Table doesn't exist - need to create via SQL
    console.log('❌ Cannot create tables via REST API - need direct SQL access');
    console.log('\n💡 Solution: Use Supabase CLI');
    console.log('\nRun these commands:\n');
    console.log('  npm install -g supabase');
    console.log('  supabase link --project-ref naoxezcmcauecawchgjk');
    console.log('  supabase db push');
    process.exit(1);
  } else if (!error) {
    console.log('✅ released_features already exists');
  }
} catch (e) {
  console.error('Error:', e.message);
}

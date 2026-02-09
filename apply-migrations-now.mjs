import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://naoxezcmcauecawchgjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1NjQ1NCwiZXhwIjoyMDc5NTMyNDU0fQ.fE55YEpc-CJydy1ADeNNa2EWQX-rxlNiaGYcAbeWjeg',
  { db: { schema: 'public' } }
);

console.log('🚀 Applying migrations...\n');

// First, let's just insert the data since tables might need to be created manually
// Check if tables exist first
const { data: rfCheck } = await supabase.from('released_features').select('count').limit(1);
const { data: uiCheck } = await supabase.from('user_integrations').select('count').limit(1);

console.log('Table check results:');
console.log('released_features:', rfCheck ? 'EXISTS' : 'MISSING');
console.log('user_integrations:', uiCheck ? 'EXISTS' : 'MISSING');

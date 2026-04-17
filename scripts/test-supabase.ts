import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConn() {
    const { data: tables, error } = await supabase
        .from('features_catalog')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Connection Error:', error.message);
    } else {
        console.log('Successfully connected to Supabase.');
        console.log('Feature catalog items found:', tables?.length);
    }

    // Check if social_accounts table even exists
    const { error: saError } = await supabase.from('social_accounts').select('*').limit(1);
    if (saError) {
        console.warn('social_accounts table error (maybe missing?):', saError.message);
    } else {
        console.log('social_accounts table exists.');
    }
}

testConn();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://naoxezcmcauecawchgjk.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTY0NTQsImV4cCI6MjA3OTUzMjQ1NH0.rGiFcwqhqQ_ToM6GWUa7AQs_N9sZAMCtDPP8xJYW0Ro';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * DB Migration for REQ-09 and REQ-10
 * Uses Supabase JS client to run DDL via rpc/SQL endpoint
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://naoxezcmcauecawchgjk.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTMzNTk1NCwiZXhwIjoyMDU0OTExOTU0fQ.FE0bSvEXVSxC7UFwQI9hy8pxgXW8gNunGJ7KlIzL5bA'

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // REQ-09: add Vercel columns to emergent_projects
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.emergent_projects 
      ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
      ADD COLUMN IF NOT EXISTS deployment_url TEXT;
    `
  })
  if (e1) console.error('REQ-09 migration error:', e1.message)
  else console.log('✅ REQ-09: emergent_projects columns added')

  // REQ-10: browser_jobs table
  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.browser_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        job_type TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        result JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS browser_jobs_status_idx ON public.browser_jobs(status, created_at);
      CREATE INDEX IF NOT EXISTS browser_jobs_user_idx ON public.browser_jobs(user_id);
    `
  })
  if (e2) console.error('REQ-10 migration error:', e2.message)
  else console.log('✅ REQ-10: browser_jobs table created')
}

main()

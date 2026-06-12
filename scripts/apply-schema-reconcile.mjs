/**
 * Apply 20260610090000_schema_reconcile_agentic.sql to the live Supabase DB.
 * Additive-only DDL (columns IF NOT EXISTS, table IF NOT EXISTS, widened
 * check constraints). Single transaction; rolls back wholesale on any error.
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';
const { Client } = pg;

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch { /* optional */ }
}

loadEnvFile('.env.local');
const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, '');
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = readFileSync('supabase/migrations/20260610090000_schema_reconcile_agentic.sql', 'utf8');
const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('RECONCILE APPLIED OK');

  // Verify the load-bearing bits
  const checks = await client.query(`
    select
      (select count(*) from information_schema.columns where table_schema='public' and table_name='job_runs' and column_name in ('idempotency_key','dedupe_key')) as job_runs_keys,
      (select count(*) from information_schema.tables where table_schema='public' and table_name='scheduled_tasks') as scheduled_tasks,
      (select pg_get_constraintdef(oid) from pg_constraint where conname='duo_projects_status_check') as duo_status,
      (select pg_get_constraintdef(oid) from pg_constraint where conname='user_comms_settings_channel_check') as channel_check
  `);
  console.log(JSON.stringify(checks.rows[0], null, 2));
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('FAILED, ROLLED BACK:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

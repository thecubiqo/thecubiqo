import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Optional env file.
  }
}

loadEnvFile(process.env.PHASE_AB_ENV_FILE || '.env.vercel.goodfeatureslegacy.local');
loadEnvFile('.env.local');

const DATABASE_URL = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, '');
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to apply Phase B migrations.');
}

const migrations = [
  '20260514000000_phase_b_agentic_core.sql',
  '20260515_connector_registry.sql',
  '20260515_user_connectors_extended.sql',
  '20260515_extension_tables.sql',
  '20260516_duo_mode_patch.sql',
  '20260523010000_phase_ab_prod_compatibility.sql',
  '20260520_security_watchdog.sql',
  '20260523011000_phase_ab_feature_db_hardening.sql'
];

async function applyMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    for (const migrationFile of migrations) {
      console.log(`Applying ${migrationFile}...`);
      const filePath = path.join('supabase', 'migrations', migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`Successfully applied ${migrationFile}`);
      } catch (err) {
        console.error(`Error applying ${migrationFile}:`, err.message);
        console.error({ code: err.code, position: err.position, detail: err.detail, hint: err.hint, where: err.where });
      }
    }
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

applyMigrations();

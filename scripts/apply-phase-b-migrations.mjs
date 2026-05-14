import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const DATABASE_URL = "postgresql://postgres.oszlufrjvibrdauuppzj:Codex%40shared26@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const migrations = [
  '20260514000000_phase_b_agentic_core.sql'
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

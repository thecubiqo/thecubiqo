import { Client } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL missing in .env.local');
        return;
    }

    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log('🔗 Connected to Supabase Postgres...');

        // 1. Core Social Army Schema
        const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260217000004_social_army_schema.sql'), 'utf-8');
        console.log('📜 Applying Social Army Schema...');
        await client.query(schemaSql);

        // 2. Fix Job statuses (the one I created today)
        const statusFixSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260310000001_fix_social_army_statuses.sql'), 'utf-8');
        console.log('📜 Applying Status Enum Fixes...');
        await client.query(statusFixSql);

        // 3. Seed Data
        const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase/seed_staging_data.sql'), 'utf-8');
        console.log('📜 Seeding initial 10-10-10 data...');
        await client.query(seedSql);

        console.log('✅ DATABASE FULLY INITIALIZED for Social Army.');
    } catch (error) {
        console.error('❌ Migration Error:', error);
    } finally {
        await client.end();
    }
}

runMigrations();

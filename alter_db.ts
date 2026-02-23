import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL missing');
        return;
    }

    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();

        // Add columns if not exist
        await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS onboarding_data JSONB,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
    `);

        console.log('Successfully altered profiles table with onboarding fields.');
    } catch (error) {
        console.error('Error altering DB:', error);
    } finally {
        await client.end();
    }
}
main();

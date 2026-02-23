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

        // Create usage_tracking
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.usage_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        identifier TEXT NOT NULL, -- user_id or session_id
        provider TEXT NOT NULL,
        cost NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS usage_tracking_identifier_idx ON public.usage_tracking (identifier);
      CREATE INDEX IF NOT EXISTS usage_tracking_created_at_idx ON public.usage_tracking (created_at);
    `);

        console.log('Successfully created usage_tracking table.');
    } catch (error) {
        console.error('Error altering DB:', error);
    } finally {
        await client.end();
    }
}
main();

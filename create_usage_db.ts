import { Client } from 'pg';

async function main() {
    const dbUrl = 'postgresql://postgres:Cubiqo%402026@db.naoxezcmcauecawchgjk.supabase.co:5432/postgres';
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        await client.query(`
      CREATE TABLE IF NOT EXISTS public.usage_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        identifier TEXT NOT NULL,
        provider TEXT NOT NULL,
        cost NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_identifier ON public.usage_tracking (identifier);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON public.usage_tracking (created_at);
    `);

        console.log('Successfully created usage_tracking table.');
    } catch (error) {
        console.error('Error altering DB:', error);
    } finally {
        await client.end();
    }
}
main();

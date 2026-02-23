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
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS tier_id TEXT DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    `);

        console.log('Successfully added stripe columns to profiles table.');
    } catch (error) {
        console.error('Error altering DB:', error);
    } finally {
        await client.end();
    }
}

main();

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
      ALTER TABLE public.sessions
      ADD COLUMN IF NOT EXISTS adaptive_model_state JSONB;
    `);

        console.log('Successfully added adaptive_model_state column to sessions table.');
    } catch (error) {
        console.error('Error altering DB:', error);
    } finally {
        await client.end();
    }
}

main();

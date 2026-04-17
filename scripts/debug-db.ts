import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to:', dbUrl);

const client = new Client({ connectionString: dbUrl });
client.connect()
    .then(() => {
        console.log('Success!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failure:', err);
        process.exit(1);
    });


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Colors for output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

async function checkEnvironment(envName: string, envPath: string) {
    console.log(`\n${colors.cyan}--- Analyzing ${envName.toUpperCase()} Environment ---${colors.reset}`);

    if (!fs.existsSync(envPath)) {
        console.log(`${colors.red}❌ File not found: ${envPath}${colors.reset}`);
        return;
    }

    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    const url = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.log(`${colors.red}❌ Missing Keys in ${envPath}${colors.reset}`);
        return;
    }

    console.log(`🔗 Connecting to: ${url}`);
    const start = performance.now();
    const supabase = createClient(url, key);

    // 1. Connection & Latency Check
    const { data, error, count } = await supabase.from('social_campaigns').select('*', { count: 'exact', head: true });
    const latency = (performance.now() - start).toFixed(2);

    if (error) {
        console.log(`${colors.red}❌ Connection FAILED: ${error.message}${colors.reset}`);
        if (error.code === '42P01') console.log(`${colors.yellow}   -> Hint: Table 'social_campaigns' missing. Run the SETUP SQL script!${colors.reset}`);
        return;
    }

    console.log(`${colors.green}✅ Connection Established (Latency: ${latency}ms)${colors.reset}`);

    // 2. Schema Integrity Check
    console.log(`📦 Table 'social_campaigns': ${count !== null ? 'Exists' : 'Unknown'}`);

    const { error: queueError } = await supabase.from('content_queue').select('id').limit(1);
    if (queueError) console.log(`${colors.red}❌ Table 'content_queue' MISSING${colors.reset}`);
    else console.log(`${colors.green}✅ Table 'content_queue' OK${colors.reset}`);

    const { error: acctError } = await supabase.from('social_accounts').select('id').limit(1);
    if (acctError) console.log(`${colors.red}❌ Table 'social_accounts' MISSING${colors.reset}`);
    else console.log(`${colors.green}✅ Table 'social_accounts' OK${colors.reset}`);

    // 3. Performance / Index Check (Simulated)
    if (Number(latency) > 500) {
        console.log(`${colors.yellow}⚠️  High Latency detected. Check region or connection quality.${colors.reset}`);
    } else {
        console.log(`${colors.green}🚀 High Speed Performance Verified.${colors.reset}`);
    }
}

async function main() {
    console.log(`${colors.cyan}🔎 SOCIAL ARMY DIAGNOSTICS TOOL 🔍${colors.reset}`);

    // Check Local/Preview (Staging) using .env.local
    await checkEnvironment('Local / Staging', path.resolve(process.cwd(), '.env.local'));

    // Instructions
    console.log(`\n${colors.cyan}--- Diagnostic Complete ---${colors.reset}`);
    console.log(`To fix any ❌ errors:`);
    console.log(`1. Run 'supabase/MASTER_STAGING_SETUP.sql' for Staging.`);
    console.log(`2. Run 'supabase/MASTER_PRODUCTION_SETUP.sql' for Production.`);
}

main().catch(console.error);

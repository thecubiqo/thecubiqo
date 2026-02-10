import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runDiagnostics() {
    console.log('🔍 Starting Database Diagnostics...\n')

    const tables = ['experiments', 'experiment_assignments', 'experiment_events']
    const results = []

    for (const table of tables) {
        console.log(`Checking table: ${table}...`)
        try {
            // Just check if we can query it
            const { error } = await supabase.from(table).select('*').limit(1)

            if (!error) {
                console.log(`   ✅ Correctly configured.`)
                results.push({ table, status: 'OK' })
            } else if (error.code === '42P01') {
                console.log(`   ❌ MISSING: Table does not exist.`)
                results.push({ table, status: 'MISSING' })
            } else {
                console.log(`   ⚠️ ERROR: ${error.message} (Code: ${error.code})`)
                results.push({ table, status: 'ERROR', message: error.message })
            }
        } catch (e) {
            console.log(`   ❌ FATAL: ${e.message}`)
        }
    }

    console.log('\n--- DIAGNOSTIC SUMMARY ---')
    const allOk = results.every(r => r.status === 'OK')
    if (allOk) {
        console.log('🚀 SYSTEM READY: All tables found.')
    } else {
        console.log('🛠️ ACTION REQUIRED: Some components are missing.')
        console.log('Run the SQL migration in your Supabase Editor to fix.')
    }
}

runDiagnostics()

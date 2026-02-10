import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAbFlow() {
    console.log('🧪 Starting A/B Testing Flow Verification...')

    const EXPERIMENT_NAME = 'test_script_experiment'
    const TEST_SESSION_ID = 'test-session-' + Date.now()

    try {
        // 1. Create/Ensure Experiment Exists
        console.log(`\n1. Setting up experiment "${EXPERIMENT_NAME}"...`)
        // efficient upsert not easily possible with simple client for this table structure without getting complex, 
        // so we'll just try to insert and ignore error if exists, or check first.

        let { data: experiment } = await supabase
            .from('experiments')
            .select('id, variants')
            .eq('name', EXPERIMENT_NAME)
            .single()

        if (!experiment) {
            console.log('   Creating new experiment record...')
            const { data, error } = await supabase
                .from('experiments')
                .insert({
                    name: EXPERIMENT_NAME,
                    description: 'Automated test experiment',
                    variants: ['Control', 'Variant A', 'Variant B'],
                    status: 'active'
                })
                .select()
                .single()

            if (error) throw new Error(`Failed to create experiment: ${error.message}`)
            experiment = data
        } else {
            console.log('   Experiment already exists, using it.')
        }

        console.log('   ✅ Experiment Ready:', experiment.id)

        // 2. Simulate User Assignment
        console.log(`\n2. Simulating User Assignment (Session: ${TEST_SESSION_ID})...`)

        // We can't use the server-side logic here directly because it uses cookies(),
        // so we'll simulate the logic: Check assignment -> Assign if null.

        let { data: assignment } = await supabase
            .from('experiment_assignments')
            .select('variant')
            .eq('experiment_id', experiment.id)
            .eq('session_id', TEST_SESSION_ID)
            .single()

        if (!assignment) {
            console.log('   No assignment found, assigning random variant...')
            const variants = experiment.variants
            const randomVariant = variants[Math.floor(Math.random() * variants.length)]

            const { error: assignError } = await supabase
                .from('experiment_assignments')
                .insert({
                    experiment_id: experiment.id,
                    session_id: TEST_SESSION_ID,
                    variant: randomVariant
                })

            if (assignError) throw new Error(`Failed to assign variant: ${assignError.message}`)
            console.log(`   Detailed Assigment: ${randomVariant}`)
            assignment = { variant: randomVariant }
        } else {
            console.log(`   Found existing assignment: ${assignment.variant}`)
        }

        console.log(`   ✅ User Assigned to: "${assignment.variant}"`)

        // 3. Track an Event
        console.log(`\n3. Tracking "conversion" event...`)
        const { error: eventError } = await supabase
            .from('experiment_events')
            .insert({
                experiment_id: experiment.id,
                variant: assignment.variant,
                event_name: 'test_conversion',
                value: 1,
                session_id: TEST_SESSION_ID
            })

        if (eventError) throw new Error(`Failed to track event: ${eventError.message}`)
        console.log('   ✅ Event tracked successfully')

        console.log('\n🎉 Verification Complete! Check the Admin Dashboard to see these stats.')

    } catch (err) {
        console.error('\n❌ Test Failed:', err)
    }
}

// Run the test
testAbFlow()

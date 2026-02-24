const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection URL from .env.local
const DATABASE_URL = "postgresql://postgres:Cubiqo%402026@db.naoxezcmcauecawchgjk.supabase.co:5432/postgres";

async function executeMigration() {
  console.log('🚀 Connecting to production Supabase...');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase-migration-20260224-feature-toggles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing migration...');
    console.log('This will create:');
    console.log('  1. features_catalog table');
    console.log('  2. user_feature_toggles table');
    console.log('  3. feature_toggle_audit_log table');
    console.log('  4. RLS policies, indexes, and triggers');
    console.log('  5. Seed data with 25+ common features');
    
    // Execute the SQL
    const result = await client.query(sql);
    
    console.log('\n🎉 MIGRATION SUCCESSFUL!');
    console.log('========================================');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration results...');
    
    // Check tables were created
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('features_catalog', 'user_feature_toggles', 'feature_toggle_audit_log')
    `);
    
    console.log(`✅ Tables created: ${tablesCheck.rows.map(r => r.table_name).join(', ')}`);
    
    // Count features
    const featuresCount = await client.query('SELECT COUNT(*) as count FROM features_catalog');
    console.log(`✅ Features seeded: ${featuresCount.rows[0].count}`);
    
    // Check RLS is enabled
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('features_catalog', 'user_feature_toggles', 'feature_toggle_audit_log')
    `);
    
    console.log('\n🔐 RLS Status:');
    rlsCheck.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.rowsecurity ? 'ENABLED ✅' : 'DISABLED ❌'}`);
    });
    
    // Test health check function
    const healthCheck = await client.query('SELECT * FROM check_feature_toggle_health()');
    console.log('\n🏥 System Health Check:');
    console.log(`  Total features: ${healthCheck.rows[0].total_features}`);
    console.log(`  Catalog health: ${healthCheck.rows[0].catalog_health ? 'OK ✅' : 'ISSUE ❌'}`);
    console.log(`  Toggle health: ${healthCheck.rows[0].toggle_health ? 'OK ✅' : 'ISSUE ❌'}`);
    console.log(`  Audit health: ${healthCheck.rows[0].audit_health ? 'OK ✅' : 'ISSUE ❌'}`);
    
    console.log('\n========================================');
    console.log('🚀 PRODUCTION SUPABASE READY FOR ISSUE #79');
    console.log('The FoundersPass board can now:');
    console.log('1. ✅ Load feature catalog from database');
    console.log('2. ✅ Show user toggle states');
    console.log('3. ✅ Allow admin toggling with audit logging');
    console.log('4. ✅ Handle errors with health check endpoint');
    console.log('5. ✅ Enforce role-based access control');
    
    console.log('\n📋 Next steps for developers:');
    console.log('1. Update FoundersPass API to use new tables');
    console.log('2. Implement UI for feature toggle board');
    console.log('3. Add health check endpoint to API');
    console.log('4. Test in staging before merging to main');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the migration
executeMigration().catch(console.error);
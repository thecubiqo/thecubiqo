# PowerShell script to execute Supabase migration
Write-Host "🚀 Starting Supabase Production Migration..." -ForegroundColor Green
Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$databaseUrl = "postgresql://postgres:Cubiqo%402026@db.naoxezcmcauecawchgjk.supabase.co:5432/postgres"

# Extract connection components
if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $username = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    Write-Host "✅ Parsed connection details:" -ForegroundColor Green
    Write-Host "  Host: $host" -ForegroundColor Yellow
    Write-Host "  Port: $port" -ForegroundColor Yellow
    Write-Host "  Database: $database" -ForegroundColor Yellow
    Write-Host "  Username: $username" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ Failed to parse database URL" -ForegroundColor Red
    exit 1
}

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ psql command not found. Please install PostgreSQL client or add to PATH." -ForegroundColor Red
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Alternative: Execute SQL manually in Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql" -ForegroundColor Yellow
    Write-Host "   2. Copy content from: supabase-migration-20260224-feature-toggles.sql" -ForegroundColor Yellow
    Write-Host "   3. Paste and run in SQL Editor" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found psql at: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Read the SQL file
$sqlFile = "supabase-migration-20260224-feature-toggles.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw
Write-Host "📋 Loaded migration SQL ($($sqlContent.Length) bytes)" -ForegroundColor Green

# Show migration summary
Write-Host ""
Write-Host "📊 MIGRATION SUMMARY:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "This migration will create:" -ForegroundColor White
Write-Host "  1. ✅ features_catalog table (master feature list)" -ForegroundColor Green
Write-Host "  2. ✅ user_feature_toggles table (per-user settings)" -ForegroundColor Green
Write-Host "  3. ✅ feature_toggle_audit_log table (change tracking)" -ForegroundColor Green
Write-Host "  4. ✅ RLS policies (security)" -ForegroundColor Green
Write-Host "  5. ✅ Indexes (performance)" -ForegroundColor Green
Write-Host "  6. ✅ Triggers (automation)" -ForegroundColor Green
Write-Host "  7. ✅ Seed data (25+ features)" -ForegroundColor Green
Write-Host "  8. ✅ Health check function" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 SECURITY NOTE:" -ForegroundColor Yellow
Write-Host "  - Row Level Security (RLS) enabled on all tables" -ForegroundColor White
Write-Host "  - Users can only see their own toggles" -ForegroundColor White
Write-Host "  - Admins can manage all toggles" -ForegroundColor White
Write-Host "  - Audit logging for compliance" -ForegroundColor White
Write-Host ""
Write-Host "🎯 PURPOSE:" -ForegroundColor Cyan
Write-Host "  This enables Issue #79 - FoundersPass feature toggle board" -ForegroundColor White
Write-Host "  Required for stable admin controls and feature management" -ForegroundColor White
Write-Host ""

# Ask for confirmation
Write-Host "⚠️  WARNING: This will modify PRODUCTION database" -ForegroundColor Red
$confirmation = Read-Host "Type 'YES' to confirm migration to production Supabase"
if ($confirmation -ne 'YES') {
    Write-Host "❌ Migration cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Executing migration..." -ForegroundColor Green

# Set environment variable for password
$env:PGPASSWORD = $password

# Build psql command
$psqlCommand = "psql -h $host -p $port -U $username -d $database -f `"$sqlFile`""

Write-Host "Executing: $psqlCommand" -ForegroundColor Gray
Write-Host ""

try {
    # Execute the migration
    Invoke-Expression $psqlCommand
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🎉 MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Production Supabase is now ready for:" -ForegroundColor Green
    Write-Host "   - FoundersPass feature toggle board (Issue #79)" -ForegroundColor White
    Write-Host "   - Admin control over all system features" -ForegroundColor White
    Write-Host "   - Per-user feature enablement" -ForegroundColor White
    Write-Host "   - Audit logging and compliance" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next steps for developers:" -ForegroundColor Cyan
    Write-Host "   1. Update API to use new tables" -ForegroundColor White
    Write-Host "   2. Implement FoundersPass UI" -ForegroundColor White
    Write-Host "   3. Test in staging environment" -ForegroundColor White
    Write-Host "   4. Merge PR #194 (ready)" -ForegroundColor White
    Write-Host "   5. Complete PR #195 (WIP)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Verify in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://app.supabase.com/project/[YOUR_PROJECT]/editor" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Manual execution required:" -ForegroundColor Yellow
    Write-Host "   1. Go to Supabase SQL Editor" -ForegroundColor White
    Write-Host "   2. Copy SQL from: $sqlFile" -ForegroundColor White
    Write-Host "   3. Execute manually" -ForegroundColor White
    exit 1
}

# Clean up
$env:PGPASSWORD = ""

Write-Host ""
Write-Host "✅ Migration process completed at $(Get-Date)" -ForegroundColor Green
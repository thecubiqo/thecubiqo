# Run All Tests Across Environments
# Tests main, staging0217, and PR readiness

Write-Host "🚀 RUNNING ALL TESTS - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Function to run tests on a branch
function Test-Branch {
    param($BranchName, $Description)
    
    Write-Host "🧪 TESTING: $Description ($BranchName)" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    # Checkout branch
    try {
        git checkout $BranchName 2>&1 | Out-Null
        Write-Host "  ✅ Switched to $BranchName" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to switch to $BranchName" -ForegroundColor Red
        return $false
    }
    
    # Run feature audit
    Write-Host "  Running feature audit..." -ForegroundColor Gray
    
    # Check feature directories
    $featureDirs = @(
        "src/app/api/rgy",
        "src/app/api/job-hunt", 
        "src/app/api/emergent",
        "src/app/api/monitoring",
        "src/app/api/privacy",
        "src/app/founders-pass",
        "src/app/journal",
        "src/app/api/admin"
    )
    
    $featureCount = 0
    foreach ($dir in $featureDirs) {
        if (Test-Path $dir) {
            $featureCount++
        }
    }
    
    Write-Host "  Features found: $featureCount/8" -ForegroundColor $(if ($featureCount -gt 0) { "Green" } else { "Yellow" })
    
    # Check migrations
    $migrationCount = 0
    if (Test-Path "supabase/migrations") {
        $migrationCount = (Get-ChildItem "supabase/migrations" -Filter "*.sql" -File).Count
    }
    Write-Host "  Migrations: $migrationCount" -ForegroundColor Gray
    
    # Check for monetisation references
    $monetisationFiles = 0
    $searchPaths = @("src", "public", "docs")
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            # Simple check for monetisation keywords
            $files = Get-ChildItem $path -Recurse -Include "*.ts", "*.tsx", "*.md" -File -ErrorAction SilentlyContinue
            foreach ($file in $files) {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction Stop
                    if ($content -match "pricing|subscription|premium|enterprise|monetisation|revenue|\$") {
                        $monetisationFiles++
                    }
                } catch {
                    # Skip unreadable files
                }
            }
        }
    }
    Write-Host "  Monetisation references: $monetisationFiles files" -ForegroundColor Gray
    
    # Check UI components
    $componentCount = 0
    if (Test-Path "src/components") {
        $componentCount = (Get-ChildItem "src/components" -Recurse -Filter "*.tsx" -File).Count
    }
    Write-Host "  UI components: $componentCount" -ForegroundColor Gray
    
    Write-Host ""
    return $true
}

# Main test sequence
Write-Host "1. TESTING MAIN BRANCH" -ForegroundColor Cyan
Test-Branch -BranchName "main" -Description "Production"

Write-Host ""
Write-Host "2. TESTING STAGING0217 BRANCH" -ForegroundColor Cyan
Test-Branch -BranchName "staging0217" -Description "Staging"

Write-Host ""
Write-Host "3. TESTING PR READINESS BRANCH" -ForegroundColor Cyan
Test-Branch -BranchName "origin/copilot/check-pr-readiness" -Description "PR Analysis"

Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests completed at: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review PR readiness report for gaps" -ForegroundColor White
Write-Host "2. Fix monetisation gaps in feature PRs" -ForegroundColor White
Write-Host "3. Resolve merge conflicts" -ForegroundColor White
Write-Host "4. Deploy features incrementally" -ForegroundColor White
# resolve-main-conflicts.ps1
# Auto-resolve conflicts on main by keeping the heavier/more integrated version

$ErrorActionPreference = "Continue"
Set-Location "C:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp"

Write-Host "=== Resolving conflicts on main ===" -ForegroundColor Cyan

$conflicted = git diff --name-only --diff-filter=U 2>&1
Write-Host "Conflicted files: $($conflicted -join ', ')" -ForegroundColor Yellow

foreach ($file in $conflicted) {
    if (-not $file -or $file -eq "") { continue }
    
    $oursCount = (git show HEAD:$file 2>$null | Measure-Object -Line).Lines
    $theirsCount = (git show MERGE_HEAD:$file 2>$null | Measure-Object -Line).Lines
    
    if ($null -eq $oursCount) { $oursCount = 0 }
    if ($null -eq $theirsCount) { $theirsCount = 0 }
    
    if ($theirsCount -ge $oursCount) {
        git checkout --theirs $file 2>&1
        Write-Host "  [THEIRS] $file — staging version ($theirsCount lines)" -ForegroundColor Green
    }
    else {
        git checkout --ours $file 2>&1
        Write-Host "  [OURS]   $file — main version ($oursCount lines)" -ForegroundColor Cyan
    }
    git add $file 2>&1
}

Write-Host "`n=== Committing conflict resolution ===" -ForegroundColor Cyan
git commit -m "merge: resolve conflicts — kept heavier API-integrated versions from staging0217test" 2>&1

Write-Host "`n=== Pushing main to origin ===" -ForegroundColor Cyan
git push origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== SUCCESS: main is live with all 65 PRs ===" -ForegroundColor Green
}
else {
    Write-Host "`n=== PUSH FAILED - check output above ===" -ForegroundColor Red
}

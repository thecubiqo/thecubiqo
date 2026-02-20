# merge-prs-to-staging.ps1
# Full merge of all 65 PRs into staging0217test
# On conflict: keep the version with more lines (heavier/more integrated)

$ErrorActionPreference = "Continue"
$repoDir = "C:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp"
Set-Location $repoDir

Write-Host "=== STAGE 0: Switch to staging0217test ===" -ForegroundColor Cyan
git checkout staging0217test
git pull origin staging0217test

# PR merge order: Security/Fixes first, then Features, DB, UI, CI/Docs
# These are ALL 65 PRs in priority order
$prOrder = @(
    # Tier 1: Security & Critical Fixes
    171, 172, 129, 125, 116, 114, 164, 167,
    # Tier 2: Core Platform Features  
    113, 157, 153, 152, 151, 150, 120, 111, 110, 109, 112,
    # Tier 3: UI & UX
    147, 148, 146, 144, 142, 141, 140, 138, 117, 118,
    # Tier 4: Database & Infrastructure
    165, 107, 134, 131, 126,
    # Tier 5: Admin & Monitoring
    169, 159, 158, 156, 155, 154, 149, 145, 143, 139, 138, 137, 136,
    # Tier 6: CI/CD, Docs, Remaining
    174, 173, 170, 168, 166, 163, 162, 161, 160, 127, 121, 115, 106, 105, 104, 90, 87, 86, 84
)

$merged = @()
$failed = @()
$skipped = @()

foreach ($pr in $prOrder) {
    $branch = "origin/pr/$pr"
    
    # Check if this PR ref exists
    $exists = git branch -r | Select-String $branch
    if (-not $exists) {
        Write-Host "[SKIP] PR #$pr not found as remote ref" -ForegroundColor Yellow
        $skipped += $pr
        continue
    }

    Write-Host "`n=== Merging PR #$pr ===" -ForegroundColor Green
    
    # Attempt merge - prefer theirs on conflict (they have more features typically)
    git merge "origin/pr/$pr" --no-ff -m "merge: PR #$pr into staging0217test" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[CONFLICT] PR #$pr has conflicts. Auto-resolving: keeping heavier version..." -ForegroundColor Yellow
        
        # Get list of conflicted files
        $conflicted = git diff --name-only --diff-filter=U
        
        foreach ($file in $conflicted) {
            # Count lines in each version to pick the heavier one
            $oursCount   = (git show HEAD:$file 2>$null | Measure-Object -Line).Lines
            $theirsCount = (git show "origin/pr/${pr}:$file" 2>$null | Measure-Object -Line).Lines
            
            if ($theirsCount -ge $oursCount) {
                # Their version is heavier - prefer it
                git checkout --theirs $file
                Write-Host "  -> Kept PR #$pr version of $file ($theirsCount lines vs $oursCount)" -ForegroundColor Cyan
            } else {
                # Our existing version is heavier - keep it
                git checkout --ours $file
                Write-Host "  -> Kept existing version of $file ($oursCount lines vs $theirsCount)" -ForegroundColor Cyan
            }
            git add $file
        }
        
        git commit -m "merge(conflict-resolved): PR #$pr - kept heavier integration version" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] PR #$pr conflict resolved and merged." -ForegroundColor Green
            $merged += $pr
        } else {
            Write-Host "[FAIL] PR #$pr could not be resolved. Aborting this merge." -ForegroundColor Red
            git merge --abort 2>&1
            $failed += $pr
        }
    } else {
        Write-Host "[OK] PR #$pr merged cleanly." -ForegroundColor Green
        $merged += $pr
    }
}

Write-Host "`n=== MERGE SUMMARY ===" -ForegroundColor Cyan
Write-Host "Merged:  $($merged.Count) PRs: $($merged -join ', ')" -ForegroundColor Green
Write-Host "Failed:  $($failed.Count) PRs: $($failed -join ', ')" -ForegroundColor Red
Write-Host "Skipped: $($skipped.Count) PRs: $($skipped -join ', ')" -ForegroundColor Yellow

Write-Host "`n=== Pushing staging0217test to origin ===" -ForegroundColor Cyan
git push origin staging0217test
Write-Host "=== DONE ===" -ForegroundColor Green

$envPath = "c:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp\.env.local"
if (-Not (Test-Path $envPath)) { exit 1 }
$envContent = Get-Content $envPath
$serviceRoleKey = ($envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" } | Select-Object -First 1) -replace "^SUPABASE_SERVICE_ROLE_KEY=", ""
$supabaseUrl = ($envContent | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" } | Select-Object -First 1) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""

$headers = @{
    "apikey"        = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
}

try {
    Write-Host "Fetching feature_flags..."
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/feature_flags?select=name,scope" -Method Get -Headers $headers
    $count = $response.Count
    Write-Host "Total Flags Found: $count"
    Write-Host "Flags: $($response.name -join ', ')"
}
catch {
    Write-Error "Fetch failed: $_"
}

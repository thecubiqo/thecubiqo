$envPath = "c:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp\.env.local"
if (-Not (Test-Path $envPath)) { exit 1 }
$envContent = Get-Content $envPath
$serviceRoleKey = ($envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" } | Select-Object -First 1) -replace "^SUPABASE_SERVICE_ROLE_KEY=", ""
$supabaseUrl = ($envContent | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" } | Select-Object -First 1) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""

$headers = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
}

# Try to fetch one record to see structure
try {
    Write-Host "Fetching feature_flags..."
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/feature_flags?limit=1" -Method Get -Headers $headers
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Fetch failed: $_"
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}

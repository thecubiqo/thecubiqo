$envPath = "c:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp\.env.local"
if (-Not (Test-Path $envPath)) {
    Write-Error ".env.local not found"
    exit 1
}

$envContent = Get-Content $envPath
$serviceRoleKey = ($envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" } | Select-Object -First 1) -replace "^SUPABASE_SERVICE_ROLE_KEY=", ""
$supabaseUrl = ($envContent | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" } | Select-Object -First 1) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""

if (-not $serviceRoleKey) {
    Write-Error "Key not found"
    exit 1
}

$baseUrl = "$supabaseUrl/rest/v1/feature_flags"
$headers = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
    "Prefer" = "resolution=merge-duplicates"
}

# Construct the array of objects explicitly using ArrayList to force array serialization
$flags = New-Object System.Collections.Generic.List[Object]

$flags.Add(@{
    name = "founders_pass_enabled"
    description = "Enables access to the /founderspass page"
    enabled = $true
    scope = "global"
    config = @{ percentage = 100 }
})

$flags.Add(@{
    name = "gmail_read_access"
    description = "Enables Gmail read integration for Founders"
    enabled = $true
    scope = "user_segment"
    config = @{ allowed_users = @("*") }
})

$flags.Add(@{
    name = "gmail_write_access"
    description = "Enables Gmail write integration for Founders"
    enabled = $true
    scope = "user_segment"
    config = @{ allowed_users = @("*") }
})

$payload = $flags | ConvertTo-Json -Depth 5 -Compress

try {
    Write-Host "Sending payload: $payload"
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $payload
    Write-Host "Success! Feature flags upserted."
} catch {
    Write-Error "Failed: $_"
    # Detailed error might be in the stream
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Details: $($reader.ReadToEnd())"
    }
    exit 1
}

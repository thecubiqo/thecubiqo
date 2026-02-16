$envPath = "c:\Users\avloy\.gemini\antigravity\scratch\thecubiqo\repo_temp\.env.local"
if (-Not (Test-Path $envPath)) {
    Write-Error ".env.local not found at $envPath"
    exit 1
}

$envContent = Get-Content $envPath
$serviceRoleKey = ($envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" } | Select-Object -First 1) -replace "^SUPABASE_SERVICE_ROLE_KEY=", ""
$supabaseUrl = ($envContent | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" } | Select-Object -First 1) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""

if (-not $serviceRoleKey) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    exit 1
}

$headers = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$body = @{
    "query" = @"
INSERT INTO feature_flags (name, description, enabled, scope, config)
VALUES (
  'founders_pass_enabled',
  'Enables access to the /founderspass page',
  true,
  'global',
  '{"percentage": 100}'
) ON CONFLICT (name) DO UPDATE SET enabled = true;

INSERT INTO feature_flags (name, description, enabled, scope, config)
VALUES (
  'gmail_read_access',
  'Enables Gmail read integration for Founders',
  true,
  'user_segment',
  '{"allowed_users": ["*"]}' 
) ON CONFLICT (name) DO UPDATE SET enabled = true;

INSERT INTO feature_flags (name, description, enabled, scope, config)
VALUES (
  'gmail_write_access',
  'Enables Gmail write integration for Founders',
  true,
  'user_segment',
  '{"allowed_users": ["*"]}'
) ON CONFLICT (name) DO UPDATE SET enabled = true;
"@
} | ConvertTo-Json

# Using /rest/v1/sql endpoint if enabled, otherwise use /rest/v1/rpc or table directly
# Since we are running raw SQL, we need the SQL editor API or a stored procedure.
# The Supabase REST API doesn't support raw SQL by default for security. 
# We should try to insert into `feature_flags` table directly using the REST API for `TABLE INSERT/UPSERT`.

# Correction: The previous approach tried to send "query" to REST API which is invalid.
# We must use the REST API format for UPSERT (POST with Prefer: resolution=merge-duplicates)

$baseUrl = "$supabaseUrl/rest/v1/feature_flags"

$payload = @(
    @{
        name = "founders_pass_enabled"
        description = "Enables access to the /founderspass page"
        enabled = $true
        scope = "global"
        config = @{ percentage = 100 }
    },
    @{
        name = "gmail_read_access"
        description = "Enables Gmail read integration for Founders"
        enabled = $true
        scope = "user_segment"
        config = @{ allowed_users = @("*") }
    },
    @{
        name = "gmail_write_access"
        description = "Enables Gmail write integration for Founders"
        enabled = $true
        scope = "user_segment"
        config = @{ allowed_users = @("*") }
    }
) | ConvertTo-Json -Depth 5

# Use upsert via POST with Prefer header
$headers["Prefer"] = "resolution=merge-duplicates"

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $payload
    Write-Host "Success! Feature flags enabled."
    $response | Start-Sleep 1 
} catch {
    Write-Error "Failed to update feature flags: $_"
    Write-Error $_.Exception.Response.GetResponseStream()
    exit 1
}

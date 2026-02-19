# Deployment Strategy: Environment Isolation for Production & Staging

To prevent data corruption and ensure stability, we implement **Environment Isolation** for the CubiQo platform. This strategy maintains separate databases for Production (live data) and Staging (testing data).

## 1. Environment Configurations

### Production Environment (`main` branch)
This is the live application serving real users.
*   **Database**: `cubiqo-production` (New Supabase Project)
*   **Branch**: `main`
*   **Deployment**: Automatic via Vercel on push to `main`.
*   **Environment Variables** (Vercel > Settings > Production):
    *   `NEXT_PUBLIC_SUPABASE_URL`: URL of `cubiqo-production`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key of `cubiqo-production`
    *   `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key of `cubiqo-production`
    *   `NEXT_PUBLIC_RP_ID`: `cubiqo.ai` (or your production domain)
    *   `NEXT_PUBLIC_ORIGIN`: `https://cubiqo.ai`

### Staging Environment (`staging0217` branch)
This is for testing new features (like CQ Messaging, Biometrics) before they go live.
*   **Database**: `cubiqo-staging` (Existing Supabase Project: `naoxezcmcauecawchgjk`)
*   **Branch**: `staging0217`
*   **Deployment**: Automatic via Vercel on push to `staging0217` (Preview deployment).
*   **Environment Variables** (Vercel > Settings > Preview):
    *   `NEXT_PUBLIC_SUPABASE_URL`: URL of `cubiqo-staging`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key of `cubiqo-staging`
    *   `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key of `cubiqo-staging`
    *   `NEXT_PUBLIC_RP_ID`: `cubiqo-staging.vercel.app` (or your staging domain)
    *   `NEXT_PUBLIC_ORIGIN`: `https://cubiqo-staging.vercel.app`

## 2. Migration Workflow
Database changes must follow this path to ensure safety:

1.  **Develop Migration in Staging**:
    *   Create a new `.sql` file in `supabase/migrations/`.
    *   Push to `staging0217`.
    *   Vercel deploys Staging.
    *   **Action**: Manually run the migration SQL in the `cubiqo-staging` Supabase Dashboard (SQL Editor).
    *   *Note: If you set up Supabase CLI in CI/CD, this can be automated.*

2.  **Verify Feature**:
    *   Test the feature on the Staging URL.
    *   Ensure data flows correctly and no errors occur.

3.  **Promote to Production**:
    *   Create a Pull Request: `staging0217` -> `main`.
    *   Review and Merge.
    *   Vercel deploys Production.
    *   **Action**: Manually run the *same* migration SQL in the `cubiqo-production` Supabase Dashboard.

## 3. Local Development
*   **Database**: Use `cubiqo-staging` or a local Supabase instance.
*   **Config**: `.env.local` file on your machine.
*   **Do NOT** connect local development to `cubiqo-production`.

## 4. Key Security Rules
*   Never use Production keys in local development.
*   Never run experimental migrations on Production database.
*   Always back up Production database before applying major migrations.

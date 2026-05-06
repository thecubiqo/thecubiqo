import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function ByoKeysPage() {
  return (
    <LegacyFeaturePage
      eyebrow="BYO Keys"
      title="Server-Side Key Vault"
      summary="BYO key storage is present as a guarded API. It refuses raw secret storage unless KEY_ENCRYPTION_SECRET is configured server-side."
      apiPath="/api/byo-keys"
      cards={[
        {
          title: 'Masked Display',
          status: 'API Ready',
          body: 'Stored keys return only masked labels and hints, never raw values.'
        },
        {
          title: 'Encryption Gate',
          status: 'Required',
          body: 'POST requests are blocked until server-side encryption is configured.'
        },
        {
          title: 'Ownership',
          status: 'RLS Ready',
          body: 'The migration includes user-owned policies so each user can only see their own key records.'
        }
      ]}
      blockers={['KEY_ENCRYPTION_SECRET must exist in Vercel and local env before real BYO key save is enabled.']}
    />
  );
}

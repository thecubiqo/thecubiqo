import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function CqPage() {
  return (
    <LegacyFeaturePage
      eyebrow="CQ to CQ"
      title="CQ Number And Messaging Scaffold"
      summary="The CQ scaffold creates a unique CQ number, contacts, and message storage in Supabase. Realtime and calling remain gated until signaling, TURN, and block/report QA are complete."
      apiPath="/api/cq"
      cards={[
        {
          title: 'CQ Number',
          status: 'API Ready',
          body: 'Signed-in users can create or retrieve a persistent CQ number after migration.'
        },
        {
          title: 'Contacts',
          status: 'API Ready',
          body: 'Contact records are user-owned and support pending, connected, and blocked states.'
        },
        {
          title: 'Realtime',
          status: 'Schema Ready',
          body: 'Realtime messaging should be enabled only after Supabase channels and blocked-user behavior pass QA.'
        }
      ]}
    />
  );
}

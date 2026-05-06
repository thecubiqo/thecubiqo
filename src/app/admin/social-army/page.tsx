import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function SocialArmyPage() {
  return (
    <LegacyFeaturePage
      eyebrow="Admin"
      title="Social Army Read-Only Console"
      summary="The legacy 10/10/10 system is exposed only as an admin-gated read-only shell. No live posting, account automation, proxy use, or GFXToolz operation is enabled."
      apiPath="/api/admin/social-army"
      cards={[
        {
          title: 'Admin Guard',
          status: 'Protected',
          body: 'The API checks admin_roles and returns 403 for normal users.'
        },
        {
          title: '10/10/10',
          status: 'Disabled',
          body: 'The workflow remains a planning artifact until credentials, permissions, audit logging, and compliance are approved.'
        },
        {
          title: 'Reports',
          status: 'Read Only',
          body: 'Campaigns, accounts, tasks, and reports can be viewed by admins once the migration is applied.'
        }
      ]}
      blockers={['No live social posting is enabled from this branch.']}
    />
  );
}

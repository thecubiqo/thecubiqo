import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function JobHuntPage() {
  return (
    <LegacyFeaturePage
      eyebrow="Job Hunter"
      title="Job Tracker First"
      summary="The safe port starts with profile, saved jobs, search records, and resume versions. Browser-based direct apply stays deferred until the extension or cloud browser sandbox is designed."
      apiPath="/api/job-hunt"
      cards={[
        {
          title: 'Profile',
          status: 'API Ready',
          body: 'Current-stack tables support target roles, locations, remote preference, and resume summary.'
        },
        {
          title: 'Applications',
          status: 'API Ready',
          body: 'Users can save applications and status once the Supabase migration is applied.'
        },
        {
          title: 'Direct Apply',
          status: 'Deferred',
          body: 'LinkedIn, Indeed, Dice, and site-level apply need browser-control permissions and anti-abuse-safe automation design before build.'
        }
      ]}
      blockers={['Browser automation is intentionally not enabled in Vercel serverless.']}
    />
  );
}

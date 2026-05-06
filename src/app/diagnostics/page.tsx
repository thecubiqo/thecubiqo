import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function DiagnosticsPage() {
  return (
    <LegacyFeaturePage
      eyebrow="Self Report"
      title="Diagnostics Without Fake Repair"
      summary="Self-report is ported as observable health checks and optional diagnostic reports. It does not claim antivirus or automatic repair behavior that is not actually implemented."
      apiPath="/api/diagnostics"
      publicApi
      cards={[
        {
          title: 'Environment',
          status: 'Live',
          body: 'The diagnostics API reports whether Supabase, provider keys, ElevenLabs, and encryption are configured without exposing secrets.'
        },
        {
          title: 'Reports',
          status: 'Schema Ready',
          body: 'Signed-in users can save diagnostic reports once the migration is applied.'
        },
        {
          title: 'Self-Heal',
          status: 'Honest',
          body: 'The system gives recommended fixes instead of claiming invisible repair or antivirus controls.'
        }
      ]}
    />
  );
}

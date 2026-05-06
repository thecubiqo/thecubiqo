import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function KeywordsPage() {
  return (
    <LegacyFeaturePage
      eyebrow="RGY Keywords"
      title="Keyword Panel Bridge"
      summary="User-owned RGY keywords can now be stored through the current API contract, with color-zone separation kept as an operational UI signal."
      apiPath="/api/keywords"
      cards={[
        {
          title: 'Color Zones',
          status: 'Schema Ready',
          body: 'Red, green/teal, blue, and yellow keywords are accepted without forcing intent when the intent is unclear.'
        },
        {
          title: 'Local Panel Behavior',
          status: 'API Ready',
          body: 'The route supports list, upsert, edit metadata, and delete for the current signed-in user.'
        },
        {
          title: 'Router Hint',
          status: 'Scoped',
          body: 'Keywords are telemetry hints only; RGY routing still falls back safely to Yellow/general.'
        }
      ]}
    />
  );
}

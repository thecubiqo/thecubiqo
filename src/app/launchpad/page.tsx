import LegacyFeaturePage from '@/next/components/legacy-safe/LegacyFeaturePage';

export default function LaunchpadPage() {
  return (
    <LegacyFeaturePage
      eyebrow="Launchpad"
      title="Website And Commerce Connectors"
      summary="Legacy launcher and ecomm ideas are ported as safe connector status surfaces first: Shopify, Printify, Printful, Stripe, and draft site records without fake live deployment."
      apiPath="/api/launchpad"
      cards={[
        {
          title: 'Connector Status',
          status: 'API Ready',
          body: 'Integrations show not connected, connected, needs action, or disabled without exposing or accepting raw secrets.'
        },
        {
          title: 'Website Launcher',
          status: 'Route Ready',
          body: 'Draft and published site schema is available through /api/sites and /sites/[slug].'
        },
        {
          title: 'Commerce Workflow',
          status: 'Staged',
          body: 'Product creation and fulfillment are deliberately later steps after secure credentials and provider flows exist.'
        }
      ]}
    />
  );
}

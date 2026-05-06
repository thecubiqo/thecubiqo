import SitePreviewPage from '@/next/components/legacy-safe/SitePreviewPage';

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SitePreviewPage slug={slug} />;
}

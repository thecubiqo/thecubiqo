// User-facing Site Template Page (dynamic [slug] route)
import { Suspense } from 'react';
import FeaturePanel from '@/components/founders-pass/FeaturePanel';

interface SitePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const oauthSuccess = typeof sp.oauth_success === 'string' ? sp.oauth_success : null;

  // In production, fetch the site config from Supabase
  // For now, show a template with the slug
  const siteConfig = {
    hero: {
      title: slug === 'vollebak-replica' ? 'The Future of Clothing' : slug.replace(/-/g, ' '),
      subtitle:
        slug === 'vollebak-replica'
          ? 'Clothing designed for the next 100 years'
          : `Welcome to ${slug.replace(/-/g, ' ')}`,
    },
    products:
      slug === 'vollebak-replica'
        ? [
            { name: 'Solar Charged Jacket', price: 595, currency: 'USD' },
            { name: 'Deep Sleep Cocoon', price: 350, currency: 'USD' },
            { name: 'Plant and Algae T-Shirt', price: 110, currency: 'USD' },
          ]
        : [],
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
        <div className="text-center px-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            {siteConfig.hero.title}
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {siteConfig.hero.subtitle}
          </p>
        </div>
      </section>

      {/* OAuth success banner */}
      {oauthSuccess && (
        <div className="bg-emerald-900/30 border-b border-emerald-700/50 px-6 py-3 text-center">
          <p className="text-emerald-300 text-sm">
            ✓ Successfully connected {oauthSuccess}
          </p>
        </div>
      )}

      {/* Products */}
      {siteConfig.products.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-8">Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {siteConfig.products.map((product) => (
              <div
                key={product.name}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-zinc-600 transition-colors"
              >
                <div className="aspect-square bg-zinc-800 flex items-center justify-center text-4xl">
                  🧥
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-indigo-400 font-medium mt-1">
                    ${product.price} {product.currency}
                  </p>
                  <button className="mt-3 w-full px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-zinc-200 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature Panel (client component) */}
      <Suspense fallback={null}>
        <FeaturePanel
          siteId={slug}
          siteSlug={slug}
        />
      </Suspense>
    </div>
  );
}

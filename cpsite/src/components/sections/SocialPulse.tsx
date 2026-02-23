import Link from 'next/link'
import { getFeaturedPosts } from '@/lib/db/posts'

// Fallback placeholder cards (shown when DB not connected)
const fallback = [
  {
    platform: 'GitHub',
    title: 'Cubiqo goes fully open source.',
    excerpt: 'All core models and the full companion stack are now on GitHub. BYO keys, BYO privacy.',
    date: 'Feb 2026',
    href: 'https://github.com/thecubiqo/thecubiqo',
  },
  {
    platform: 'Update',
    title: 'Rozana Journal — daily AI reflections.',
    excerpt: 'Your AI companion now guides a structured daily reflection, surfacing patterns you might otherwise miss.',
    date: 'Jan 2026',
    href: '/lifes-work',
  },
  {
    platform: 'Feature',
    title: 'RGY context — your life in colour.',
    excerpt: 'Red · Yellow · Green. Colour-code every aspect of your life so Cubiqo can surface opportunities.',
    date: 'Jan 2026',
    href: '/lifes-work',
  },
]

export default async function SocialPulse() {
  let cards: { platform: string; title: string; excerpt: string | null; date: string; href: string }[] = []

  try {
    const posts = await getFeaturedPosts()
    cards = posts.map(p => ({
      platform: p.category ?? 'Site',
      title: p.title,
      excerpt: p.excerpt ?? null,
      date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      href: `/lifes-work/${p.slug}`,
    }))
  } catch {
    // DB not connected
  }

  const display = cards.length > 0 ? cards : fallback

  return (
    <section className="bg-[#080808] px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Recent</p>
            <p className="text-[18px] text-[#F6F3EE] font-[440]">
              Latest updates, features, and community highlights — all in one place.
            </p>
          </div>
          <Link
            href="/lifes-work"
            className="hidden md:block text-[12px] uppercase tracking-[0.18em] text-[#A9A9A9] hover:text-[#F6F3EE] transition"
          >
            All posts →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-[#1A1A1E]">
          {display.map((card, i) => (
            <a
              key={i}
              href={card.href}
              target={card.href.startsWith('http') ? '_blank' : undefined}
              rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group bg-[#0B0B0D] p-8 hover:bg-[#111114] transition-colors block"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#A9A9A9]">
                  {card.platform}
                </span>
                <span className="text-[11px] text-[#5A5752]">{card.date}</span>
              </div>
              <h3 className="text-[16px] font-[490] leading-[1.4] text-[#F6F3EE] mb-3">
                {card.title}
              </h3>
              {card.excerpt && (
                <p className="text-[13px] text-[#5A5752] leading-[1.6] line-clamp-3 group-hover:text-[#A9A9A9] transition">
                  {card.excerpt}
                </p>
              )}
              <span className="block mt-6 text-[11px] uppercase tracking-[0.18em] text-[#5A5752] group-hover:text-[#A9A9A9] transition">
                Open →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}


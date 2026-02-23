import type { Metadata } from 'next'
import Link from 'next/link'
import TopNav from '@/components/nav/TopNav'
import Footer from '@/components/sections/Footer'
import { getPublishedPosts } from '@/lib/db/posts'

export const metadata: Metadata = { title: "Life's Work" }

// Revalidate every hour so new posts appear without a redeploy
export const revalidate = 3600

const pillars = [
  { href: '/lifes-work/writing',     label: 'Writing' },
  { href: '/lifes-work/music',       label: 'Music' },
  { href: '/lifes-work/field-notes', label: 'Field Notes' },
]

export default async function LifesWorkPage() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = []
  try {
    posts = await getPublishedPosts()
  } catch {
    // DB not configured yet
  }

  return (
    <>
      <TopNav theme="dark" />
      <main className="bg-[#0B0B0D] text-[#F6F3EE] min-h-screen pt-28 pb-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">

          {/* Page header */}
          <h1 className="text-[40px] md:text-[56px] font-[520] tracking-[-0.025em] leading-[1.06]">
            Life's Work
          </h1>
          <p className="mt-4 text-[16px] text-[#A9A9A9] max-w-xl leading-[1.65]">
            Writing, music, and field notes — posted simply, kept intact.
          </p>

          {/* Pillar nav */}
          <div className="mt-12 flex flex-wrap gap-6 border-b border-[#1A1A1E] pb-12">
            {pillars.map(p => (
              <Link
                key={p.href}
                href={p.href}
                className="text-[12px] uppercase tracking-[0.18em] text-[#A9A9A9] hover:text-[#F6F3EE] transition"
              >
                {p.label}
              </Link>
            ))}
          </div>

          {/* Post list */}
          <div className="mt-12 space-y-0 divide-y divide-[#1A1A1E]">
            {posts.length === 0 && (
              <p className="py-12 text-[#A9A9A9] text-[15px]">No posts yet.</p>
            )}
            {posts.map(post => (
              <article key={post.slug} className="py-10 group">
                <Link href={`/lifes-work/${post.slug}`} className="block">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9]">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#5A5752]">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-[22px] md:text-[26px] font-[490] tracking-[-0.01em] leading-[1.2] group-hover:text-[#A9A9A9] transition">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 text-[15px] text-[#5A5752] leading-[1.6] max-w-2xl group-hover:text-[#A9A9A9] transition">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="block mt-4 text-[12px] text-[#A9A9A9] group-hover:text-[#F6F3EE] transition">
                    Read →
                  </span>
                </Link>
              </article>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}


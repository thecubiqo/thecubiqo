import Link from 'next/link'
import { getAllPostsAdmin } from '@/lib/db/posts'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminDashboard() {
  let posts: Awaited<ReturnType<typeof getAllPostsAdmin>> = []
  let dbError = false
  try {
    posts = await getAllPostsAdmin()
  } catch {
    dbError = true
  }

  const published = posts.filter(p => p.published).length
  const drafts    = posts.filter(p => !p.published).length

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F6F3EE] px-8 py-14">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-1">Admin</p>
            <h1 className="text-[28px] font-[520]">Carl Phillips</h1>
          </div>
          <LogoutButton />
        </div>

        {dbError && (
          <div className="border border-[#7C2020]/40 text-[#7C2020] px-5 py-4 text-[13px] mb-10">
            Database not connected. Add Supabase env vars to enable full functionality.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-[#1A1A1E] mb-14">
          {[
            { label: 'Total', value: posts.length },
            { label: 'Published', value: published },
            { label: 'Drafts', value: drafts },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0B0B0D] px-6 py-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">{stat.label}</p>
              <p className="text-[36px] font-[520]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-6 mb-14">
          <Link
            href="/admin/new"
            className="border border-[#F6F3EE]/20 px-6 py-3 text-[14px] hover:bg-[#F6F3EE]/5 transition"
          >
            New Post →
          </Link>
          <Link
            href="/admin/posts"
            className="text-[14px] text-[#A9A9A9] hover:text-[#F6F3EE] transition self-center"
          >
            All Posts
          </Link>
          <Link
            href="/"
            className="text-[14px] text-[#A9A9A9] hover:text-[#F6F3EE] transition self-center"
          >
            View Site
          </Link>
        </div>

        {/* Recent posts */}
        {posts.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-6">Recent</p>
            <div className="space-y-0 divide-y divide-[#1A1A1E]">
              {posts.slice(0, 5).map(post => (
                <div key={post.id} className="py-4 flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] uppercase tracking-[0.14em] mr-3 ${post.published ? 'text-[#A9A9A9]' : 'text-[#7C2020]'}`}>
                      {post.published ? 'Live' : 'Draft'}
                    </span>
                    <span className="text-[15px]">{post.title}</span>
                  </div>
                  <Link
                    href={`/lifes-work/${post.slug}`}
                    className="text-[12px] text-[#A9A9A9] hover:text-[#F6F3EE]"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


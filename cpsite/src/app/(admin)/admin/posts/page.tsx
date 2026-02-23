import { getAllPostsAdmin } from '@/lib/db/posts'
import Link from 'next/link'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminPostsPage() {
  let posts: Awaited<ReturnType<typeof getAllPostsAdmin>> = []
  try {
    posts = await getAllPostsAdmin()
  } catch {
    // DB not connected yet
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F6F3EE] px-8 py-14">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-1">Admin</p>
            <h1 className="text-[28px] font-[520]">All Posts</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin/new" className="text-[13px] text-[#A9A9A9] hover:text-[#F6F3EE] transition">
              New Post →
            </Link>
            <LogoutButton />
          </div>
        </div>

        {posts.length === 0 && (
          <p className="text-[#A9A9A9] text-[15px]">No posts yet.</p>
        )}

        <div className="space-y-0 divide-y divide-[#1A1A1E]">
          {posts.map(post => (
            <div key={post.id} className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className={`shrink-0 text-[10px] uppercase tracking-[0.14em] border px-2 py-0.5 ${
                  post.published
                    ? 'border-[#A9A9A9]/30 text-[#A9A9A9]'
                    : 'border-[#7C2020]/30 text-[#7C2020]'
                }`}>
                  {post.published ? 'Live' : 'Draft'}
                </span>
                <span className="text-[15px] truncate">{post.title}</span>
                <span className="text-[12px] text-[#A9A9A9] shrink-0">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <Link
                href={`/lifes-work/${post.slug}`}
                className="shrink-0 text-[12px] text-[#A9A9A9] hover:text-[#F6F3EE] transition"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}


import { getAllPosts } from '@/lib/posts/getAllPosts';
import Link from 'next/link';

export default async function AdminPostsPage() {
  const posts = await getAllPosts();
  return (
    <main className="p-12 max-w-3xl">
      <h1 className="text-[28px] font-[520] mb-8">All Posts</h1>
      {posts.length === 0 && <p className="text-[#A9A9A9]">No posts yet.</p>}
      <div className="space-y-0 divide-y divide-[#E2DDD7]">
        {posts.map((p) => (
          <div key={p.slug} className="py-4 flex items-center justify-between">
            <div>
              <span className="text-[12px] text-[#A9A9A9] mr-3">{p.date}</span>
              <span className="text-[16px]">{p.title}</span>
            </div>
            <Link href={`/post/${p.slug}`} className="text-[13px] text-[#A9A9A9] hover:text-[#0B0B0D]">
              View →
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

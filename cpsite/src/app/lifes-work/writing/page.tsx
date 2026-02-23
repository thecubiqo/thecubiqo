import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { getAllPosts } from '@/lib/posts/getAllPosts';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Updates' };

export default async function WritingPage() {
  const posts = await getAllPosts('writing');
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-3xl mx-auto">
        <H1>Updates</H1>
        <P className="mt-4 text-[#5A5752]">Product updates, release notes, and announcements.</P>
        <div className="mt-16 space-y-0 divide-y divide-[#E2DDD7]">
          {posts.length === 0 && (
            <p className="text-[#A9A9A9] text-[15px] py-8">No posts yet.</p>
          )}
          {posts.map((post) => (
            <article key={post.slug} className="py-8">
              <Link href={`/post/${post.slug}`} className="group block">
                <span className="text-[12px] text-[#A9A9A9] uppercase tracking-[0.14em]">
                  {post.date} {post.location ? `· ${post.location}` : ''}
                </span>
                <h2 className="text-[20px] font-[490] mt-1 group-hover:underline underline-offset-4">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-[15px] text-[#5A5752] mt-2 leading-[1.65]">{post.excerpt}</p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

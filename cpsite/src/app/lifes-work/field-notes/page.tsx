import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { getAllPosts } from '@/lib/posts/getAllPosts';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Field Notes' };

export default async function FieldNotesPage() {
  const posts = await getAllPosts('field-notes');
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <H1>Field Notes</H1>
        <P className="mt-4 text-[#5A5752]">
          Image-led posts. Handwritten at times. Always kept.
        </P>

        <div className="mt-16 grid md:grid-cols-2 gap-8">
          {posts.length === 0 && (
            <p className="text-[#A9A9A9] text-[15px]">No field notes yet.</p>
          )}
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/post/${post.slug}`} className="group block">
                {post.image && (
                  <div className="aspect-[4/3] overflow-hidden mb-4 bg-[#E2DDD7]">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                )}
                {!post.image && (
                  <div className="aspect-[4/3] bg-[#E2DDD7] mb-4" />
                )}
                <span className="text-[12px] text-[#A9A9A9] uppercase tracking-[0.14em]">
                  {post.date}
                </span>
                <h2 className="text-[18px] font-[490] mt-1 group-hover:underline underline-offset-4">{post.title}</h2>
              </Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

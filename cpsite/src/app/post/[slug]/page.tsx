import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { getPost } from '@/lib/posts/getPost';
import { getAllPosts } from '@/lib/posts/getAllPosts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const all = await getAllPosts();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-2xl mx-auto">
        <header className="mb-12">
          <span className="text-[12px] text-[#A9A9A9] uppercase tracking-[0.14em]">
            {post.date}{post.location ? ` · ${post.location}` : ''}
          </span>
          <h1 className="text-[36px] md:text-[48px] font-[520] tracking-[-0.02em] leading-[1.1] mt-2">
            {post.title}
          </h1>
        </header>

        {/* Share bar */}
        <div className="flex items-center gap-4 mb-12 border-y border-[#E2DDD7] py-4">
          <span className="text-[13px] text-[#A9A9A9]">Share</span>
          <a href="#" className="text-[13px] text-[#5A5752] hover:text-[#0B0B0D]">LinkedIn</a>
          <a href="#" className="text-[13px] text-[#5A5752] hover:text-[#0B0B0D]">Facebook</a>
          <a href="#" className="text-[13px] text-[#5A5752] hover:text-[#0B0B0D]">Instagram</a>
          <a href="#" className="text-[13px] text-[#5A5752] hover:text-[#0B0B0D]">X</a>
          <button
            onClick={() => { if (typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href) }}
            className="ml-auto text-[13px] text-[#5A5752] hover:text-[#0B0B0D]"
          >
            Copy link ↗
          </button>
        </div>

        <article className="prose prose-stone max-w-none text-[17px] leading-[1.75]">
          {post.content}
        </article>
      </main>
      <Footer />
    </>
  );
}

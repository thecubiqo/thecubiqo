import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import TopNav from '@/components/nav/TopNav'
import Footer from '@/components/sections/Footer'
import SocialLinks from '@/components/social/SocialLinks'
import CopyLinkButton from '@/components/social/CopyLinkButton'
import { getPostBySlug, getPublishedPosts } from '@/lib/db/posts'
import {
  linkedInShareUrl,
  facebookShareUrl,
  xShareUrl,
} from '@/lib/social/generateCaptions'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts()
    return posts.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cubiqo.ai'
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: `${siteUrl}/lifes-work/${post.slug}`,
      type: 'article',
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cubiqo.ai'
  const postUrl = `${siteUrl}/lifes-work/${post.slug}`

  const dateStr = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <TopNav theme="dark" />
      <main className="bg-[#0B0B0D] text-[#F6F3EE] min-h-screen">
        <article className="max-w-2xl mx-auto px-6 pt-32 pb-28">

          {/* Header */}
          <header className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-4">
              {dateStr}
              {post.location ? ` · ${post.location}` : ''}
              {` · ${post.category}`}
            </p>
            <h1 className="text-[36px] md:text-[52px] font-[520] tracking-[-0.025em] leading-[1.08] text-[#F6F3EE]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-[18px] text-[#A9A9A9] leading-[1.55]">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Cover image */}
          {post.cover_image && (
            <div className="mb-14 overflow-hidden">
              <Image
                src={post.cover_image}
                alt={post.title}
                width={1200}
                height={700}
                className="w-full object-cover"
                style={{ filter: 'saturate(0.88) contrast(1.04)' }}
              />
            </div>
          )}

          {/* Music embed */}
          {post.music_url && (
            <div className="mb-14">
              <iframe
                src={post.music_url.replace('open.spotify.com/track', 'open.spotify.com/embed/track')}
                width="100%"
                height="80"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="border-0 opacity-90"
              />
            </div>
          )}

          {/* Body */}
          <div className="
            text-[17px] leading-[1.78] text-[#D7D2C8]
            [&_p]:mb-6
            [&_h2]:text-[#F6F3EE] [&_h2]:text-[24px] [&_h2]:font-[520] [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:tracking-[-0.01em]
            [&_h3]:text-[#F6F3EE] [&_h3]:text-[18px] [&_h3]:font-[500] [&_h3]:mt-10 [&_h3]:mb-3
            [&_img]:w-full [&_img]:my-10
            [&_blockquote]:border-l-2 [&_blockquote]:border-[#A9A9A9]/20 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[#A9A9A9]
            [&_a]:text-[#F6F3EE] [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-[#A9A9A9]/40
            [&_ul]:list-none [&_ul]:space-y-2 [&_ul_li]:before:content-['—'] [&_ul_li]:before:mr-3 [&_ul_li]:before:text-[#A9A9A9]
            [&_code]:text-[#B9B2A6] [&_code]:font-mono [&_code]:text-[14px]
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Share */}
          <div className="mt-20 pt-8 border-t border-[#1A1A1E]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-5">Share →</p>
            <div className="flex flex-wrap gap-6 text-[13px] text-[#A9A9A9]">
              <a
                href={linkedInShareUrl(postUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F6F3EE] transition"
              >
                LinkedIn
              </a>
              <a
                href={facebookShareUrl(postUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F6F3EE] transition"
              >
                Facebook
              </a>
              <a
                href={xShareUrl(post.title, postUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F6F3EE] transition"
              >
                X
              </a>
              <CopyLinkButton url={postUrl} />
            </div>
          </div>

          {/* Social links footer */}
          <div className="mt-12 pt-8 border-t border-[#1A1A1E]">
            <SocialLinks />
          </div>

        </article>
      </main>
      <Footer />
    </>
  )
}

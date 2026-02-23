'use client'

import { useState, FormEvent } from 'react'
import {
  linkedInShareUrl,
  facebookShareUrl,
  xShareUrl,
  generateLinkedInCaption,
  generateFacebookCaption,
  generateXCaption,
} from '@/lib/social/generateCaptions'

const CATEGORIES = ['writing', 'field-notes', 'music'] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

interface PublishedPost {
  slug: string
  title: string
  excerpt: string | null
}

export default function PostEditor() {
  const [title,      setTitle]      = useState('')
  const [slug,       setSlug]       = useState('')
  const [content,    setContent]    = useState('')
  const [excerpt,    setExcerpt]    = useState('')
  const [location,   setLocation]   = useState('')
  const [category,   setCategory]   = useState<string>('writing')
  const [coverImage, setCoverImage] = useState('')
  const [musicUrl,   setMusicUrl]   = useState('')
  const [published,  setPublished]  = useState(true)
  const [featured,   setFeatured]   = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [published_post, setPublishedPost] = useState<PublishedPost | null>(null)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug || slug === slugify(val)) {
      setSlug(slugify(val))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setPublishedPost(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:        slug || slugify(title),
          title,
          content,
          excerpt:     excerpt || null,
          location:    location || null,
          category,
          cover_image: coverImage || null,
          music_url:   musicUrl || null,
          published,
          featured,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Publish failed')
      }

      const post = await res.json() as { slug: string; title: string; excerpt?: string | null }
      setPublishedPost({ slug: post.slug, title: post.title, excerpt: post.excerpt ?? null })

      // Reset form
      setTitle(''); setSlug(''); setContent(''); setExcerpt('')
      setLocation(''); setCoverImage(''); setMusicUrl('')
      setPublished(true); setFeatured(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cubiqo.ai'
  const postUrl = published_post ? `${siteUrl}/lifes-work/${published_post.slug}` : ''

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F6F3EE] px-8 py-14">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Admin</p>
        <h1 className="text-[28px] font-[520] mb-14">New Post</h1>

        {/* Success: share block */}
        {published_post && (
          <div className="border border-[#F6F3EE]/10 p-8 mb-14">
            <p className="text-[13px] text-[#A9A9A9] mb-1 uppercase tracking-[0.14em]">
              {published ? 'Published' : 'Saved as draft'}
            </p>
            <p className="text-[20px] font-[490] mb-8">{published_post.title}</p>

            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-5">Share →</p>
            <div className="flex flex-wrap gap-6 text-[13px] text-[#A9A9A9] mb-8">
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
                href={xShareUrl(published_post.title, postUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F6F3EE] transition"
              >
                X
              </a>
            </div>

            {/* Generated captions */}
            <div className="space-y-6">
              {[
                {
                  label: 'LinkedIn caption',
                  text: generateLinkedInCaption({ title: published_post.title, excerpt: published_post.excerpt, url: postUrl }),
                },
                {
                  label: 'Facebook caption',
                  text: generateFacebookCaption({ title: published_post.title, excerpt: published_post.excerpt, url: postUrl }),
                },
                {
                  label: 'X / Twitter',
                  text: generateXCaption({ title: published_post.title, url: postUrl }),
                },
              ].map(cap => (
                <div key={cap.label}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#A9A9A9] mb-2">{cap.label}</p>
                  <pre className="text-[13px] text-[#B9B2A6] whitespace-pre-wrap font-mono leading-[1.65] bg-[#111114] p-4 border border-[#1A1A1E]">
                    {cap.text}
                  </pre>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPublishedPost(null)}
              className="mt-10 text-[12px] text-[#A9A9A9] hover:text-[#F6F3EE] transition uppercase tracking-[0.16em]"
            >
              Write another →
            </button>
          </div>
        )}

        {/* Post form */}
        {!published_post && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <p className="text-[13px] text-[#7C2020] border border-[#7C2020]/30 px-4 py-3">{error}</p>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                required
                placeholder="Another Year and It's Still"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#F6F3EE] placeholder-[#3A3A3E] px-4 py-3 text-[18px] focus:outline-none focus:border-[#A9A9A9]"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="auto-generated"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#A9A9A9] placeholder-[#3A3A3E] px-4 py-3 text-[14px] font-mono focus:outline-none focus:border-[#A9A9A9]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-[#0B0B0D] border border-[#1A1A1E] text-[#F6F3EE] px-4 py-3 text-[14px] focus:outline-none focus:border-[#A9A9A9]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="New York, NY"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#F6F3EE] placeholder-[#3A3A3E] px-4 py-3 text-[15px] focus:outline-none focus:border-[#A9A9A9]"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Excerpt (used in share captions)</label>
              <textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={2}
                placeholder="Short summary shown in previews and social captions…"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#F6F3EE] placeholder-[#3A3A3E] px-4 py-3 text-[15px] focus:outline-none focus:border-[#A9A9A9] resize-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Content (Markdown)</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={20}
                required
                placeholder={"Write in Markdown.\n\n## Heading\n\nParagraph text.\n\n![Image alt](/images/life/moments/photo.jpg)"}
                className="w-full bg-[#080808] border border-[#1A1A1E] text-[#D7D2C8] placeholder-[#3A3A3E] px-4 py-4 text-[15px] font-mono leading-[1.65] focus:outline-none focus:border-[#A9A9A9] resize-y"
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Cover image URL (optional)</label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="/images/posts/my-post/cover.jpg"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#F6F3EE] placeholder-[#3A3A3E] px-4 py-3 text-[14px] font-mono focus:outline-none focus:border-[#A9A9A9]"
              />
            </div>

            {/* Music embed */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#A9A9A9] mb-2">Spotify / SoundCloud URL (optional)</label>
              <input
                type="text"
                value={musicUrl}
                onChange={e => setMusicUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/…"
                className="w-full bg-transparent border border-[#1A1A1E] text-[#F6F3EE] placeholder-[#3A3A3E] px-4 py-3 text-[14px] font-mono focus:outline-none focus:border-[#A9A9A9]"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-8 pt-2">
              {[
                { label: 'Publish on site', value: published, setter: setPublished },
                { label: 'Feature on homepage', value: featured, setter: setFeatured },
              ].map(toggle => (
                <label key={toggle.label} className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => toggle.setter(!toggle.value)}
                    className={`w-10 h-5 border transition relative ${toggle.value ? 'bg-[#F6F3EE] border-[#F6F3EE]' : 'bg-transparent border-[#3A3A3E]'}`}
                    aria-pressed={toggle.value}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-[#0B0B0D] transition-all ${toggle.value ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                  <span className="text-[13px] text-[#A9A9A9]">{toggle.label}</span>
                </label>
              ))}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="border border-[#F6F3EE]/20 px-8 py-3 text-[14px] hover:bg-[#F6F3EE]/5 transition disabled:opacity-40"
              >
                {submitting ? 'Publishing…' : published ? 'Publish Post' : 'Save Draft'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPostBySlug, updatePost, getAllPostsAdmin } from '@/lib/db/posts'

function isAdmin(request: NextRequest) {
  const cookie = request.cookies.get('cpsite_admin')?.value
  return cookie && cookie === process.env.ADMIN_TOKEN
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { slug } = await params
  try {
    // Find post id by slug (admin client sees all)
    const all = await getAllPostsAdmin()
    const found = all.find(p => p.slug === slug)
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await request.json()
    const updated = await updatePost(found.id, body)
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPublishedPosts, createPost } from '@/lib/db/posts'
import type { PostInsert } from '@/lib/db/posts'

function isAdmin(request: NextRequest) {
  const cookie = request.cookies.get('cpsite_admin')?.value
  return cookie && cookie === process.env.ADMIN_TOKEN
}

export async function GET() {
  try {
    const posts = await getPublishedPosts()
    return NextResponse.json(posts)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json() as PostInsert
    const post = await createPost(body)
    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create post'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

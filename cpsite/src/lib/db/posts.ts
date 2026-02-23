import { supabase, getAdminClient } from './supabase'

export interface Post {
  id: string
  slug: string
  title: string
  content: string
  cover_image?: string | null
  music_url?: string | null
  category: string
  excerpt?: string | null
  location?: string | null
  published: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>

/** Public: list all published posts, newest first */
export async function getPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Public: get one published post by slug */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

/** Admin: get all posts (including drafts) */
export async function getAllPostsAdmin(): Promise<Post[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Admin: insert a new post */
export async function createPost(post: PostInsert): Promise<Post> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('posts')
    .insert(post)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Admin: update an existing post */
export async function updatePost(id: string, patch: Partial<PostInsert>): Promise<Post> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Public: get up to 3 featured published posts for the Pulse section */
export async function getFeaturedPosts(): Promise<Array<Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'created_at'>>> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, category, created_at')
    .eq('published', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

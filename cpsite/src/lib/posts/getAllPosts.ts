import fs from 'fs';
import path from 'path';
import { parseFrontmatter, type PostFrontmatter } from './parseFrontmatter';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export async function getAllPosts(category?: string): Promise<PostFrontmatter[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data } = parseFrontmatter(raw);
    return {
      ...data,
      slug: data.slug || file.replace(/\.(mdx|md)$/, ''),
    };
  });

  const filtered = category
    ? posts.filter((p) => p.category === category)
    : posts;

  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
}

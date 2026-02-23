import fs from 'fs';
import path from 'path';
import { parseFrontmatter, type PostFrontmatter } from './parseFrontmatter';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export interface Post extends PostFrontmatter {
  content: string;
}

export async function getPost(slug: string): Promise<Post | null> {
  for (const ext of ['.mdx', '.md']) {
    const filePath = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);
      return { ...data, slug, content };
    }
  }
  return null;
}

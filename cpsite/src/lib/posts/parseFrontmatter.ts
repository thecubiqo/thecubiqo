export interface PostFrontmatter {
  title: string;
  date: string;
  slug: string;
  category?: string;
  excerpt?: string;
  location?: string;
  image?: string;
  tags?: string[];
}

export function parseFrontmatter(raw: string): { data: PostFrontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: { title: 'Untitled', date: '', slug: '' }, content: raw };
  }
  const [, frontmatter, content] = match;
  const data: Record<string, unknown> = {};
  for (const line of frontmatter.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
      data[key.trim()] = value;
    }
  }
  return { data: data as PostFrontmatter, content: content.trim() };
}

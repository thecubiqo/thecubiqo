export interface ShareData {
  title: string
  excerpt?: string | null
  url: string
}

export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function xShareUrl(title: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
}

export function generateLinkedInCaption({ title, excerpt, url }: ShareData): string {
  const lines = [title]
  if (excerpt) lines.push('', excerpt)
  lines.push('', url)
  return lines.join('\n')
}

export function generateFacebookCaption({ title, excerpt, url }: ShareData): string {
  const lines = [title]
  if (excerpt) lines.push('', excerpt)
  lines.push('', url)
  return lines.join('\n')
}

export function generateXCaption({ title, url }: ShareData): string {
  const max = 240
  const suffix = ` — ${url}`
  if (title.length + suffix.length <= max) return title + suffix
  return title.slice(0, max - suffix.length - 1) + '…' + suffix
}

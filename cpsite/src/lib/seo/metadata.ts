import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carlphillips.com';

export const siteMetadata = {
  name: 'Carl Phillips',
  description: 'Humanitarian leadership. Music. Education. Writing. At the edge of life.',
  url: BASE_URL,
};

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: siteMetadata.name,
      template: `%s — ${siteMetadata.name}`,
    },
    description: siteMetadata.description,
    openGraph: {
      type: 'website',
      siteName: siteMetadata.name,
      url: BASE_URL,
    },
    ...overrides,
  };
}

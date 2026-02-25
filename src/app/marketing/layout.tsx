/**
 * CubiQo Marketing — Independent Social Army Dashboard
 *
 * Standalone layout that wraps the marketing / social media
 * management panel. Fully isolated from the main cubiqo.ai
 * layout so it keeps working independently.
 *
 * Accessible via:
 *   - cubiqo.ai/marketing
 *   - cubiqo.marketing (via middleware rewrite)
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CubiQo Marketing — Social Army Command Center',
  description:
    'Social media management across 10 platforms. Create accounts, launch campaigns, and post samples. Accessible at cubiqo.marketing.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

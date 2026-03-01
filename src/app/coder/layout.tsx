/**
 * CubiQo Coder — Independent Coding Panel
 *
 * Standalone layout that wraps the coding panel in its own
 * isolated shell. This layout has NO dependency on the main
 * cubiqo.ai layout or providers, so it stays functional even
 * if other parts of the app are broken.
 *
 * Accessible via:
 *   - cubiqo.ai/coder
 *   - cubiqo.dev (via middleware rewrite)
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CubiQo Coder — AI-Powered IDE',
  description:
    'Independent coding panel with Monaco editor, AI conversation, terminal, and live preview. Accessible at cubiqo.dev.',
};

export default function CoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen antialiased">
      {children}
    </div>
  );
}

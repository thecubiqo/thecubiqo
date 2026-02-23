import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Cubiqo', template: '%s — Cubiqo' },
  description: 'Open-source AI companion with voice, journaling, and intelligent matching. Privacy-first. BYO mode.',
};

/*
 * For production (Vercel), swap the system-font body below for:
 *
 *   import { Cormorant_Garamond, Inter } from 'next/font/google'
 *   const inter      = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
 *   const cormorant  = Cormorant_Garamond({ subsets: ['latin'], weight: ['300','400','500'],
 *                        style: ['normal','italic'], variable: '--font-cormorant', display: 'swap' })
 *
 *   <html className={`${inter.variable} ${cormorant.variable} scroll-smooth`}>
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black text-[#F2EFE8] antialiased">
        {children}
      </body>
    </html>
  );
}


import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Carl Phillips', template: '%s — Carl Phillips' },
  description: 'Humanitarian leadership. Music. Education. Writing. At the edge of life.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#F6F3EE] text-[#0B0B0D] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '../../frontend/src/index.css';
import '../../frontend/src/App.css';

export const metadata: Metadata = {
  title: 'CubiQo',
  description: 'CubiQo QA platform shell'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

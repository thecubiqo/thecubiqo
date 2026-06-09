import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CubiQo',
  description: 'CubiQo QA platform shell'
};

const cleanEnv = (...values: Array<string | undefined>) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_URL
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.REACT_APP_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  )
};

const publicEnvScript = `window.__CUBIQO_ENV__=${JSON.stringify(publicEnv).replace(/</g, '\\u003c')};`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: publicEnvScript }} />
        {children}
      </body>
    </html>
  );
}

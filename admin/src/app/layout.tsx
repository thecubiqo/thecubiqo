import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Portal Admin",
  description: "Multi-tenant web portal administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}


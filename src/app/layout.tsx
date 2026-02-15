import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Force dynamic rendering to ensure auth state is always fresh
export const dynamic = 'force-dynamic';

// SEO Metadata
export const metadata: Metadata = {
  title: "CubiQo | Voice-First Private AI Assistant & Digital Secretary",
  description: "CubiQo is a voice-first, privacy-controlled AI assistant that acts like a digital private secretary—using color-based intent signals to route intelligence, adapt tone, and help users act through conversation.",
  keywords: "CubiQo, Cubiqo AI, AI assistant, artificial intelligence, voice AI, voice first AI, private AI assistant, digital private secretary, AI companion, cooperative AI, conversational AI, AI orchestration platform, color based AI, RGY AI, cuboid AI, cube AI assistant, CQ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CubiQo",
  },
  // Open Graph
  openGraph: {
    title: "CubiQo | Voice-First Private AI Assistant",
    description: "CubiQo is a conversation-first, privacy-controlled AI assistant designed to act like a digital private secretary using color-based intent signals.",
    type: "website",
    url: "https://www.cubiqo.ai",
    siteName: "CubiQo",
    images: [
      {
        url: "https://www.cubiqo.ai/og.png",
        width: 1200,
        height: 630,
        alt: "CubiQo - Voice-First Private AI Assistant",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "CubiQo | Voice-First Private AI Assistant",
    description: "A cooperative, voice-first AI that routes intelligence by intent—not memory.",
    images: ["https://www.cubiqo.ai/og.png"],
  },
  // Additional SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://www.cubiqo.ai",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6F00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// JSON-LD Structured Data
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is CubiQo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CubiQo is a voice-first, privacy-controlled AI assistant designed to act like a digital private secretary through conversation."
      }
    },
    {
      "@type": "Question",
      "name": "Is CubiQo an AI assistant or an AI companion?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CubiQo is an AI assistant with a cooperative companion-style interface. It is not emotional or sentient."
      }
    },
    {
      "@type": "Question",
      "name": "How is CubiQo different from ChatGPT or Siri?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CubiQo is voice-first, privacy-focused, does not store conversations, and routes intelligence automatically using intent signals."
      }
    },
    {
      "@type": "Question",
      "name": "Does CubiQo store conversations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. CubiQo does not retain conversations or build long-term memory profiles."
      }
    },
    {
      "@type": "Question",
      "name": "What is color-based AI in CubiQo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Color-based AI in CubiQo uses Red, Green, and Yellow as operational intent signals to adapt interaction style."
      }
    },
    {
      "@type": "Question",
      "name": "Can CubiQo act like a private secretary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CubiQo helps users organize actions, connect with people, enable trade, and perform tasks through conversation."
      }
    },
    {
      "@type": "Question",
      "name": "Is CubiQo voice-first?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CubiQo is designed primarily for spoken interaction."
      }
    },
    {
      "@type": "Question",
      "name": "Can users bring their own AI keys?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CubiQo supports Bring-Your-Own AI and cloud infrastructure."
      }
    }
  ]
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CubiQo",
  "applicationCategory": "AI Orchestration Platform",
  "operatingSystem": "Web",
  "description": "Voice-first, privacy-controlled AI assistant acting as a digital private secretary using intent-based color signals.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CubiQo",
  "url": "https://www.cubiqo.ai",
  "logo": "https://www.cubiqo.ai/og.png",
  "description": "Voice-first, privacy-controlled AI assistant and digital private secretary."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="canonical" href="https://www.cubiqo.ai" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className="antialiased"
      >
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

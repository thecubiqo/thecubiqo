import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-2xl mx-auto">
        <H1>Contact</H1>

        <div className="mt-12 space-y-8">
          <div>
            <p className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-2">Email</p>
            <a
              href="mailto:hello@carlphillips.com"
              className="text-[20px] font-[440] hover:underline underline-offset-4"
            >
              hello@carlphillips.com
            </a>
          </div>

          <div>
            <p className="text-[13px] uppercase tracking-[0.18em] text-[#A9A9A9] mb-3">Elsewhere</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'LinkedIn', href: 'https://linkedin.com/in/carlphillips' },
                { label: 'Facebook', href: 'https://facebook.com/carlphillips' },
                { label: 'Instagram', href: 'https://instagram.com/carlphillips' },
                { label: 'X / Twitter', href: 'https://x.com/carlphillips' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] text-[#5A5752] hover:text-[#0B0B0D] transition"
                >
                  {s.label} →
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

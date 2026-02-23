import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Demo' };

const demos = [
  {
    title: 'Voice Conversations',
    description: 'Natural voice interaction with emotional modulation — powered by open models like Llama and Mixtral.',
    bullets: [
      'Sub-100ms latency voice response',
      'Emotional modulation and context carry-over',
      'Open-source models (Llama, Mixtral, DeepSeek)',
      'BYO API keys — your data stays yours',
    ],
  },
  {
    title: 'Rozana Journal',
    description: 'Daily AI-guided reflections that surface patterns and insights from your own private data.',
    bullets: [
      'Guided daily reflection prompts',
      'RGY colour-coded life context (Red · Yellow · Green)',
      'Pattern recognition across journal entries',
      'Fully private — runs on your own keys',
    ],
  },
  {
    title: 'Intelligent Matching',
    description: 'AI-powered opportunity discovery based on your interests and life context.',
    bullets: [
      'Intent-based matching engine',
      'Opportunity cards tailored to your RGY profile',
      'Community + partner integrations',
      'Privacy-first design — no data sold',
    ],
  },
];

export default function WorkPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <H1>Demo</H1>
        <P className="mt-4 max-w-xl text-[#5A5752]">
          Explore the core Cubiqo features — voice, journal, and intelligent matching.
        </P>

        <div className="mt-20 space-y-20">
          {demos.map((demo) => (
            <article key={demo.title} className="border-t border-[#E2DDD7] pt-10">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 mb-6">
                <h2 className="text-[22px] font-[520] tracking-[-0.01em]">{demo.title}</h2>
              </div>
              <p className="text-[15px] text-[#5A5752] leading-[1.7] mb-6">{demo.description}</p>
              <ul className="space-y-2">
                {demo.bullets.map((b) => (
                  <li key={b} className="text-[16px] text-[#3A3734] flex gap-3">
                    <span className="text-[#A9A9A9] shrink-0">—</span>{b}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* CTA */}
          <div className="border-t border-[#E2DDD7] pt-10">
            <a
              href="https://cubiqo.ai"
              className="inline-flex items-center gap-2 border border-[#0B0B0D] px-5 py-2 text-[14px] hover:bg-[#0B0B0D] hover:text-[#F6F3EE] transition"
            >
              Launch Cubiqo →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

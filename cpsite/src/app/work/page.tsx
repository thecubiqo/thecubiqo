import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Work' };

const roles = [
  {
    org: 'International Rescue Committee',
    location: 'New York / Remote',
    years: '2016 – present',
    title: 'Senior Program Manager',
    bullets: [
      'Team of 22 staff and volunteers',
      '$12M federal grant portfolio',
      '3,000 clients served annually',
      'Refugee resettlement, employment, economic mobility',
    ],
    image: null,
  },
  {
    org: 'Peace Corps',
    location: 'Zambia',
    years: '2012 – 2014',
    title: 'Education Volunteer',
    bullets: [
      'Secondary school education reform',
      'HIV/AIDS community programming',
      'Gender equity initiatives',
      'Teacher training and curriculum development',
    ],
    image: null,
  },
];

export default function WorkPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <H1>Work</H1>
        <P className="mt-4 max-w-xl text-[#5A5752]">
          Programs, teams, funding, outcomes — built to hold weight.
        </P>

        <div className="mt-20 space-y-20">
          {roles.map((role) => (
            <article key={role.org} className="border-t border-[#E2DDD7] pt-10">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 mb-6">
                <h2 className="text-[22px] font-[520] tracking-[-0.01em]">{role.org}</h2>
                <span className="text-[13px] text-[#A9A9A9]">{role.years} · {role.location}</span>
              </div>
              <p className="text-[14px] uppercase tracking-[0.12em] text-[#A9A9A9] mb-4">{role.title}</p>
              <ul className="space-y-2">
                {role.bullets.map((b) => (
                  <li key={b} className="text-[16px] text-[#3A3734] flex gap-3">
                    <span className="text-[#A9A9A9] shrink-0">—</span>{b}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* CV Download */}
          <div className="border-t border-[#E2DDD7] pt-10">
            <a
              href="/carl-phillips-cv.pdf"
              className="inline-flex items-center gap-2 border border-[#0B0B0D] px-5 py-2 text-[14px] hover:bg-[#0B0B0D] hover:text-[#F6F3EE] transition"
            >
              Download CV (PDF) ↓
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const reveal = (delay = 0) => ({
  initial:     { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 1.0, ease: EASE, delay },
});

const roles = [
  {
    org: 'International Rescue Committee',
    link: 'https://rescue.org',
    period: '2016 – Present',
    location: 'New York, NY',
    title: 'Senior Program Manager',
    body: 'Leads a 22-person team delivering resettlement, employment, and economic mobility services to over 3,000 refugees and immigrants annually. Direct oversight of a $12M federal grant portfolio.',
    stats: [
      { n: '22',   label: 'Staff & volunteers' },
      { n: '$12M', label: 'Federal grant' },
      { n: '3k+',  label: 'Clients annually' },
    ],
  },
  {
    org: 'Peace Corps — Zambia',
    link: null as string | null,
    period: '2012 – 2014',
    location: 'Southern Province',
    title: 'Education Volunteer',
    body: 'Two-year service placement teaching secondary school, designing HIV/AIDS curriculum adopted by four schools, and leading gender equity workshops reaching 200+ students.',
    stats: [
      { n: '200+', label: 'Students reached' },
      { n: '4',    label: 'Schools, curriculum' },
      { n: '2',    label: 'Years in field' },
    ],
  },
];

export default function WorkSection() {
  return (
    <section className="bg-black px-6 md:px-16 py-[140px] border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">

        <motion.div {...reveal()}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Work</p>
          <h2
            className="text-[40px] md:text-[58px] font-[400] tracking-[-0.03em] leading-[1.06] max-w-3xl text-[#F2EFE8]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Leadership. Program design.<br className="hidden md:block" /> International service.
          </h2>
        </motion.div>

        <div className="mt-20 grid md:grid-cols-2 gap-px bg-white/[0.08]">
          {roles.map((role, i) => (
            <motion.div key={role.org} {...reveal(i * 0.1)}>
              <div className="bg-black p-10 md:p-12 h-full flex flex-col">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-6">
                  {role.period} · {role.location}
                </p>
                <h3
                  className="text-[24px] md:text-[28px] font-[400] text-[#F2EFE8] leading-[1.1] tracking-[-0.02em] mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {role.link
                    ? <a href={role.link} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition">{role.org}</a>
                    : role.org}
                </h3>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-8">{role.title}</p>
                <p className="text-[15px] text-white/55 leading-[1.8] mb-12 flex-1">{role.body}</p>
                <div className="grid grid-cols-3 gap-px bg-white/[0.08]">
                  {role.stats.map(s => (
                    <div key={s.label} className="bg-black pt-5 pb-4 pr-4">
                      <p className="text-[26px] font-[300] text-[#F2EFE8] leading-none tracking-[-0.02em]"
                         style={{ fontFamily: 'var(--font-display)' }}>
                        {s.n}
                      </p>
                      <p className="text-[11px] text-white/35 mt-1.5 leading-[1.4]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.2)} className="mt-px bg-white/[0.08]">
          <div className="bg-black px-10 md:px-12 py-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-4">
              Arts &amp; Education · 2008 – Present
            </p>
            <h3
              className="text-[24px] font-[400] text-[#F2EFE8] tracking-[-0.02em] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Musical Director &amp; Educator
            </h3>
            <p className="text-[15px] text-white/55 leading-[1.8] max-w-2xl">
              BMus — piano performance and music education. Musical direction for theater, choral, and community
              ensembles. Integration of music and language learning in underserved educational settings.
            </p>
          </div>
        </motion.div>

        <motion.div {...reveal(0.3)} className="mt-14 flex flex-wrap gap-10 items-center">
          <a
            href="/carl-phillips-cv.pdf"
            className="text-[12px] uppercase tracking-[0.22em] border border-white/[0.08] px-6 py-3 text-white/55 hover:border-white/[0.14] hover:text-[#F2EFE8] hover:bg-white/[0.04] transition duration-300"
          >
            Download CV ↓
          </a>
          <a
            href="https://linkedin.com/in/carlphillips"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
          >
            LinkedIn Profile →
          </a>
          <Link
            href="/work"
            className="text-[12px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70 transition"
          >
            Full History →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

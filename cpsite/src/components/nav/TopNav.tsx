'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavLink from './NavLink';

const links = [
  { href: '/life',       label: 'Life' },
  { href: '/work',       label: 'Work' },
  { href: '/lifes-work', label: "Life's Work" },
  { href: '/contact',    label: 'Contact' },
];

export default function TopNav({ theme: _theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 h-14 transition-all duration-500 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md border-b border-white/[0.08]'
          : 'bg-transparent'
      }`}
    >
      <Link
        href="/"
        className="text-[11px] font-[500] tracking-[0.22em] uppercase text-white/35 hover:text-white/70 transition"
      >
        CP
      </Link>
      <div className="flex items-center gap-8 md:gap-10">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} label={l.label} />
        ))}
      </div>
    </nav>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLink from './NavLink';

interface Props {
  theme?: 'dark' | 'light';
}

const links = [
  { href: '/life', label: 'Life' },
  { href: '/work', label: 'Work' },
  { href: '/lifes-work', label: "Life's Work" },
  { href: '/contact', label: 'Contact' },
];

export default function TopNav({ theme = 'dark' }: Props) {
  const isDark = theme === 'dark';
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-14 ${
        isDark ? 'bg-transparent' : 'bg-[#F6F3EE]/90 border-b border-[#E2DDD7]'
      } backdrop-blur-sm`}
    >
      <Link
        href="/"
        className={`text-[15px] font-[460] tracking-[0.02em] ${isDark ? 'text-[#F6F3EE]' : 'text-[#0B0B0D]'}`}
      >
        CP
      </Link>
      <div className="flex items-center gap-6 md:gap-8">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} label={l.label} theme={theme} />
        ))}
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href: string;
  label: string;
  theme?: 'dark' | 'light';
}

export default function NavLink({ href, label, theme = 'dark' }: Props) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  const base = theme === 'dark' ? 'text-[#F6F3EE]/70 hover:text-[#F6F3EE]' : 'text-[#5A5752] hover:text-[#0B0B0D]';
  const activeClass = theme === 'dark' ? 'text-[#F6F3EE]' : 'text-[#0B0B0D]';
  return (
    <Link href={href} className={`text-[13px] transition ${active ? activeClass : base}`}>
      {label}
    </Link>
  );
}

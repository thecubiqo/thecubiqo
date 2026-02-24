'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href: string;
  label: string;
  theme?: 'dark' | 'light';
}

export default function NavLink({ href, label }: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`text-[11px] uppercase tracking-[0.20em] transition ${
        active ? 'text-[#F2EFE8]' : 'text-white/30 hover:text-white/65'
      }`}
    >
      {label}
    </Link>
  );
}


import Link from 'next/link';

type Platform = 'LinkedIn' | 'Facebook' | 'Instagram' | 'X';

interface Props {
  platform: Platform;
  title: string;
  excerpt: string;
  date: string;
  href: string;
}

const platformColor: Record<Platform, string> = {
  LinkedIn: '#0077B5',
  Facebook: '#1877F2',
  Instagram: '#C13584',
  X: '#000000',
};

export default function PulseCard({ platform, title, excerpt, date, href }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#F6F3EE] p-6 border border-[#E2DDD7] hover:border-[#0B0B0D] transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[11px] uppercase tracking-[0.16em] font-[560]"
          style={{ color: platformColor[platform] }}
        >
          {platform}
        </span>
        <span className="text-[12px] text-[#A9A9A9]">{date}</span>
      </div>
      <h3 className="text-[15px] font-[490] leading-[1.45] mb-2">{title}</h3>
      <p className="text-[13px] text-[#5A5752] leading-[1.6] line-clamp-3">{excerpt}</p>
      <span className="block mt-5 text-[12px] text-[#A9A9A9] group-hover:text-[#0B0B0D] transition">
        Open →
      </span>
    </Link>
  );
}

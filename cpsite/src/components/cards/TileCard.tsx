import Link from 'next/link';

interface Props {
  href: string;
  label: string;
  desc: string;
}

export default function TileCard({ href, label, desc }: Props) {
  return (
    <Link
      href={href}
      className="group bg-[#F6F3EE] p-8 md:p-10 block hover:bg-[#0B0B0D] hover:text-[#F6F3EE] transition-colors duration-300"
    >
      <h2 className="text-[20px] font-[520] mb-3 tracking-[-0.01em]">{label}</h2>
      <p className="text-[14px] text-[#5A5752] group-hover:text-[#B9B2A6] leading-[1.65]">{desc}</p>
      <span className="block mt-8 text-[13px] text-[#A9A9A9] group-hover:text-[#F6F3EE]/60">
        Explore →
      </span>
    </Link>
  );
}

interface Props {
  className?: string
}

const links = [
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/carlphillips' },
  { label: 'Facebook',  href: 'https://facebook.com/carlphillips' },
  { label: 'Instagram', href: 'https://instagram.com/carlphillips' },
  { label: 'X',         href: 'https://x.com/carlphillips' },
]

export default function SocialLinks({ className = '' }: Props) {
  return (
    <div className={`flex flex-wrap gap-5 ${className}`}>
      {links.map(l => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] uppercase tracking-[0.18em] text-[#A9A9A9] hover:text-[#F6F3EE] transition"
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}

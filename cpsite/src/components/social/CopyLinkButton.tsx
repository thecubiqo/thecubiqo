'use client'

interface Props {
  url: string
  className?: string
}

export default function CopyLinkButton({ url, className = '' }: Props) {
  function copy() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }
  return (
    <button
      onClick={copy}
      className={`text-[13px] text-[#A9A9A9] hover:text-[#F6F3EE] transition ${className}`}
    >
      Copy link ↗
    </button>
  )
}

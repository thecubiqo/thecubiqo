interface Props {
  children: React.ReactNode;
  className?: string;
}

export function H1({ children, className = '' }: Props) {
  return (
    <h1
      className={`text-[40px] md:text-[56px] font-[520] tracking-[-0.025em] leading-[1.06] text-[#0B0B0D] ${className}`}
    >
      {children}
    </h1>
  );
}

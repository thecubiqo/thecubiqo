interface Props {
  children: React.ReactNode;
  className?: string;
}

export function P({ children, className = '' }: Props) {
  return (
    <p className={`text-[17px] leading-[1.7] text-[#3A3734] ${className}`}>
      {children}
    </p>
  );
}

// Badge Component
'use client';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: string;
  pulse?: boolean;
}

const badgeStyles = {
  default: 'bg-zinc-700 text-zinc-200',
  success: 'bg-emerald-900 text-emerald-300 border border-emerald-700',
  warning: 'bg-amber-900 text-amber-300 border border-amber-700',
  error: 'bg-red-900 text-red-300 border border-red-700',
  info: 'bg-indigo-900 text-indigo-300 border border-indigo-700',
  neutral: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  outline: 'bg-transparent text-zinc-400 border border-zinc-700',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
  icon,
  pulse = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

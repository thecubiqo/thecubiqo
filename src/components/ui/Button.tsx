// Button Component with variants
'use client';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'destructive'
  | 'ghost'
  | 'outline'
  | 'neutral';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50',
  secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50',
  warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/50',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50',
  destructive: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300 border border-zinc-700',
  outline: 'bg-transparent border border-zinc-600 text-zinc-200 hover:bg-zinc-800',
  neutral: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 
        rounded-lg font-medium 
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "neutral" | "primary"
  pulse?: boolean
  icon?: string | React.ReactNode
}

function Badge({ className, variant = "default", pulse, icon, ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-zinc-700 text-zinc-100",
    secondary: "border-transparent bg-zinc-800 text-zinc-300",
    destructive: "border-transparent bg-red-900 text-red-300",
    outline: "border-zinc-700 text-zinc-300",
    success: "border-transparent bg-green-900/50 text-green-300",
    warning: "border-transparent bg-yellow-900/50 text-yellow-300",
    neutral: "border-transparent bg-zinc-600 text-zinc-200",
    primary: "border-transparent bg-indigo-900/50 text-indigo-300",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }

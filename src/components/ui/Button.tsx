import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[--color-accent] text-white font-semibold hover:bg-[--color-accent-dim] shadow-[0_0_16px_rgba(124,142,245,0.25)] hover:shadow-[0_0_22px_rgba(124,142,245,0.38)]',
  ghost:
    'bg-transparent border border-[--color-border] text-[--color-text] hover:bg-[--color-surface-2] hover:border-[--color-text-muted]/25',
  danger:
    'bg-transparent border border-red-800/60 text-red-400 hover:bg-red-500/10 hover:border-red-600/60',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

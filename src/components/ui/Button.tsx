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
    'bg-gradient-to-br from-[#818cf8] to-[#6366f1] text-white font-semibold shadow-[0_2px_16px_rgba(129,140,248,0.22)] hover:shadow-[0_3px_24px_rgba(129,140,248,0.38)] hover:brightness-[1.07]',
  ghost:
    'border border-[var(--color-border)] bg-white/[.04] text-[var(--color-text)] hover:bg-white/[.08] hover:border-[var(--color-border-strong)]',
  danger:
    'border border-red-500/25 bg-red-500/[.08] text-red-400 hover:bg-red-500/[.14] hover:border-red-400/40',
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
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40',
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

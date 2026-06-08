import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'accent' | 'neutral' | 'warning' | 'success'

const tones: Record<Tone, string> = {
  accent: 'bg-[--color-accent]/10 text-[--color-accent] border border-[--color-accent]/20',
  neutral: 'bg-[--color-surface-2] text-[--color-text-muted]',
  warning: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

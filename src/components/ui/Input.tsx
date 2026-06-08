import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'w-full bg-[--color-surface-2] border border-[--color-border] rounded-lg px-3 py-2.5 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent] focus:ring-2 focus:ring-[--color-accent]/10 transition-all',
        className,
      )}
    />
  )
}

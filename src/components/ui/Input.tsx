import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2.5 text-sm text-[--color-text] placeholder:text-[--color-text-muted] transition-all focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/[.12]',
        className,
      )}
    />
  )
}

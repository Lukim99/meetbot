import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-xl border border-white/[.06] bg-[--color-surface] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

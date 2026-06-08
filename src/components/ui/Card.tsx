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
        'bg-[--color-surface] rounded-xl p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

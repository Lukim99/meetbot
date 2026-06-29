import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full px-5 py-7 md:px-8 md:py-8', className)}>{children}</div>
}

export function PageHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-7 flex items-center justify-between gap-3">
      <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-[var(--color-text)]">
        {title}
      </h1>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

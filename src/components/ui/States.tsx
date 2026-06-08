import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function Loading({ label = '불러오는 중...', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div
      className={
        fullScreen
          ? 'flex h-full items-center justify-center gap-2 text-sm text-[--color-text-muted]'
          : 'flex items-center justify-center gap-2 py-16 text-sm text-[--color-text-muted]'
      }
    >
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-red-400">
      오류: {message}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  message,
  children,
}: {
  icon: LucideIcon
  message: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[--color-surface-2]">
        <Icon size={22} className="text-[--color-text-muted]" />
      </div>
      <p className="text-sm text-[--color-text-muted]">{message}</p>
      {children}
    </div>
  )
}

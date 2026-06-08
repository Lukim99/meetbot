import { cn } from '../../lib/cn'
import { initial } from '../../lib/format'

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-[--color-accent]/20 text-[--color-accent] font-semibold',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initial(name)}
    </span>
  )
}

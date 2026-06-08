import { Medal } from 'lucide-react'

const medalColor: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
}

export function RankBadge({ rank }: { rank: number }) {
  const color = medalColor[rank]
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center"
      aria-label={`${rank}위`}
    >
      {color ? (
        <Medal size={20} style={{ color }} />
      ) : (
        <span className="text-sm text-[--color-text-muted]">{rank}</span>
      )}
    </span>
  )
}

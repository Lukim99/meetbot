import { cn } from '../../lib/cn'

interface TabsProps {
  tabs: string[]
  active: number
  onChange: (index: number) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            'shrink-0 px-4 py-2 text-sm transition-colors cursor-pointer border-b-2 -mb-px',
            i === active
              ? 'border-[--color-accent] text-[--color-accent] font-medium'
              : 'border-transparent text-[--color-text-muted] hover:text-[--color-text]',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

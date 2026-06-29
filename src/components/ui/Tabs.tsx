import { cn } from '../../lib/cn'

interface TabsProps {
  tabs: string[]
  active: number
  onChange: (index: number) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            'shrink-0 px-4 py-2 text-sm transition-colors cursor-pointer border-b-2 -mb-px',
            i === active
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

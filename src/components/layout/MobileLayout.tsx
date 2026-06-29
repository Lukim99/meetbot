import { NavLink, Outlet } from 'react-router-dom'
import { LayoutContext } from '../../lib/layoutContext'
import { useAuth } from '../../hooks/useAuth'
import { NAV_ITEMS, toPath } from './nav'
import { cn } from '../../lib/cn'

export function MobileLayout() {
  const { isAdmin } = useAuth()
  const items = NAV_ITEMS.filter((i) => !i.admin || isAdmin)

  return (
    <LayoutContext.Provider value={{ isMobile: true }}>
      <div className="flex h-full flex-col">
        <main className="min-w-0 flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex pb-[env(safe-area-inset-bottom)]"
          style={{
            background: 'rgba(22,26,38,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {items.map(({ label, icon: Icon, path }) => (
            <NavLink key={path} to={toPath(path, true)} className="flex flex-1 min-h-16">
              {({ isActive }) => (
                <div
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                    isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200',
                      isActive && 'bg-[var(--color-accent)]/[.12]',
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  <span className="truncate text-[10px] leading-tight">
                    {label === '내 프로필' ? '나' : label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </LayoutContext.Provider>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bot, Crown, LogOut } from 'lucide-react'
import { LayoutContext } from '../../lib/layoutContext'
import { useAuth } from '../../hooks/useAuth'
import { logout } from '../../lib/auth'
import { Avatar } from '../ui/Avatar'
import { NAV_ITEMS } from './nav'
import { cn } from '../../lib/cn'

export function PCLayout() {
  const { user, isAdmin, isOwner } = useAuth()
  const navigate = useNavigate()

  const mainItems = NAV_ITEMS.filter((i) => !i.admin)
  const adminItems = NAV_ITEMS.filter((i) => i.admin)

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-[--color-surface-2] text-[--color-text] font-medium'
        : 'text-[--color-text-muted] hover:bg-[--color-surface-2]/60 hover:text-[--color-text]',
    )

  return (
    <LayoutContext.Provider value={{ isMobile: false }}>
      <div className="flex h-full">
        <aside className="flex w-56 shrink-0 flex-col bg-[--color-surface]" style={{ borderRight: '1px solid var(--color-border)' }}>
          <div className="flex h-14 items-center gap-2.5 px-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--color-accent]/20">
              <Bot size={15} className="text-[--color-accent]" />
            </div>
            <span className="text-sm font-semibold text-[--color-text]">
              모임봇
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
            {mainItems.map(({ label, icon: Icon, path }) => (
              <NavLink key={path} to={path} className={navClass}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <div className="my-2 border-t border-[--color-border]" />
                {adminItems.map(({ label, icon: Icon, path }) => (
                  <NavLink key={path} to={path} className={navClass}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2.5">
              {/* 프로필 이미지 + 권한 뱃지 */}
              <div className="relative shrink-0">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <Avatar name={user?.name ?? '?'} size={32} />
                )}
                {isOwner && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-[1.5px] ring-[--color-surface]">
                    <Crown size={7} className="text-white" />
                  </span>
                )}
                {!isOwner && isAdmin && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 ring-[1.5px] ring-[--color-surface]">
                    <Crown size={7} className="text-white" />
                  </span>
                )}
              </div>
              {/* 텍스트 정보 */}
              <div className="min-w-0 flex-1">
                {user?.title && (
                  <div className="truncate text-[9px] font-medium text-[--color-accent]">{user.title}</div>
                )}
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-[9px] font-semibold text-[--color-text-muted]">Lv.{user?.level ?? 1}</span>
                  <span className="truncate text-xs font-medium text-[--color-text]">{user?.kakao_name || user?.name}</span>
                </div>
                <div className="truncate text-[10px] text-[--color-text-muted]">@{user?.name}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="로그아웃"
                className="shrink-0 cursor-pointer text-[--color-text-muted] transition-colors hover:text-[--color-text]"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[--color-bg]">
          <Outlet />
        </main>
      </div>
    </LayoutContext.Provider>
  )
}

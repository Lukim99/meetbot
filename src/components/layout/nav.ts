import { Trophy, Users, CalendarDays, User, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  admin?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: '랭킹', icon: Trophy, path: '/ranking' },
  { label: '멤버', icon: Users, path: '/members' },
  { label: '일정', icon: CalendarDays, path: '/meetings' },
  { label: '내 프로필', icon: User, path: '/profile' },
  { label: '관리', icon: ShieldCheck, path: '/admin', admin: true },
]

// builds the route taking the mobile prefix into account
export function toPath(path: string, isMobile: boolean): string {
  return isMobile ? `/m${path}` : path
}

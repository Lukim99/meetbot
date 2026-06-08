import { useAuthStore } from '../store/authStore'
import { PERM_OWNER, PERM_ADMIN } from '../types'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const ready = useAuthStore((s) => s.ready)
  const isOwner = !!user?.permission?.includes(PERM_OWNER)
  const isAdmin = isOwner || !!user?.permission?.includes(PERM_ADMIN)
  return { user, ready, isAdmin, isOwner }
}

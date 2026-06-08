import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loading } from '../ui/States'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()
  const isMobile = location.pathname.startsWith('/m/')

  if (!ready) return <Loading />
  if (!user) return <Navigate to={isMobile ? '/m/login' : '/login'} replace />
  if (!isAdmin) return <Navigate to={isMobile ? '/m/ranking' : '/ranking'} replace />
  return <>{children}</>
}

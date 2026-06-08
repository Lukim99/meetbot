import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { PCLayout } from '../components/layout/PCLayout'
import { MobileLayout } from '../components/layout/MobileLayout'
import { RequireAuth } from '../components/layout/RequireAuth'
import { RequireAdmin } from '../components/layout/RequireAdmin'
import Login from '../pages/Login'
import Ranking from '../pages/Ranking'
import Members from '../pages/Members'
import MemberDetail from '../pages/MemberDetail'
import Profile from '../pages/Profile'
import Meetings from '../pages/Meetings'
import MeetingDetail from '../pages/MeetingDetail'
import AdminDashboard from '../pages/admin/AdminDashboard'
import WelcomeMsg from '../pages/admin/WelcomeMsg'
import Commands from '../pages/admin/Commands'
import Settlements from '../pages/admin/Settlements'
import Titles from '../pages/admin/Titles'

const protectedChildren: RouteObject[] = [
  { path: 'ranking', element: <Ranking /> },
  { path: 'members', element: <Members /> },
  { path: 'members/:id', element: <MemberDetail /> },
  { path: 'profile', element: <Profile /> },
  { path: 'meetings', element: <Meetings /> },
  { path: 'meetings/:id', element: <MeetingDetail /> },
  { path: 'admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: 'admin/welcome', element: <RequireAdmin><WelcomeMsg /></RequireAdmin> },
  { path: 'admin/commands', element: <RequireAdmin><Commands /></RequireAdmin> },
  { path: 'admin/settlements', element: <RequireAdmin><Settlements /></RequireAdmin> },
  { path: 'admin/titles', element: <RequireAdmin><Titles /></RequireAdmin> },
]

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent)
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={isMobileDevice() ? '/m/ranking' : '/ranking'} replace /> },
  { path: '/login', element: <Login /> },
  { path: '/m/login', element: <Login /> },
  {
    element: (
      <RequireAuth>
        <PCLayout />
      </RequireAuth>
    ),
    children: protectedChildren,
  },
  {
    path: '/m',
    element: (
      <RequireAuth>
        <MobileLayout />
      </RequireAuth>
    ),
    children: protectedChildren,
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

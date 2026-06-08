import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  ready: boolean
  setUser: (user: User) => void
  setReady: (ready: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
  clear: () => set({ user: null }),
}))

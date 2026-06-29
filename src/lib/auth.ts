import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'
import { hasLeft } from './userStatus'
import type { User } from '../types'

const UID_KEY = 'uid'

export class NeedCodeError extends Error {
  needCode = true
  constructor() {
    super('코드가 필요합니다')
    this.name = 'NeedCodeError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

async function fetchUserByName(name: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (error) throw new AuthError(error.message)
  return data as User | null
}

export async function login(name: string, code?: string): Promise<User> {
  const user = await fetchUserByName(name.trim())
  if (!user) throw new AuthError('유저를 찾을 수 없습니다')
  if (hasLeft(user.logs)) throw new AuthError('퇴장한 유저는 로그인할 수 없습니다')

  const ua = navigator.userAgent
  const known = user.logged_in_agent?.includes(ua)

  if (!known) {
    if (!code) throw new NeedCodeError()
    if (code !== user.code) throw new AuthError('코드가 올바르지 않습니다')

    const nextAgents = [...(user.logged_in_agent ?? []), ua]
    const { error } = await supabase
      .from('users')
      .update({ logged_in_agent: nextAgents, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) throw new AuthError(error.message)
    user.logged_in_agent = nextAgents
  }

  sessionStorage.setItem(UID_KEY, user.id)
  useAuthStore.getState().setUser(user)
  return user
}

export function logout() {
  sessionStorage.removeItem(UID_KEY)
  useAuthStore.getState().clear()
}

export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState()
  const uid = sessionStorage.getItem(UID_KEY)
  if (!uid) {
    store.setReady(true)
    return
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (error || !data || hasLeft((data as User).logs)) {
    sessionStorage.removeItem(UID_KEY)
    store.clear()
  } else {
    store.setUser(data as User)
  }
  store.setReady(true)
}

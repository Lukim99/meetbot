import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export function useUser(id: string | undefined) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUser(data as User | null)
        setLoading(false)
      })
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { user, loading, error, refetch: fetch }
}

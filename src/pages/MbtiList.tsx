import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { MBTI_TYPES } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Loading, ErrorState } from '../components/ui/States'

interface MbtiRow {
  id: string
  name: string
  mbti: string | null
}

export default function MbtiList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [rows, setRows] = useState<MbtiRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, mbti')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows((data ?? []) as MbtiRow[])
        setLoading(false)
      })
  }, [])

  const buckets = useMemo(() => {
    const map = new Map<string, MbtiRow[]>()
    for (const t of MBTI_TYPES) map.set(t, [])
    const unset: MbtiRow[] = []
    for (const r of rows) {
      if (r.mbti && map.has(r.mbti)) map.get(r.mbti)!.push(r)
      else unset.push(r)
    }
    const result: { type: string; users: MbtiRow[] }[] = [...map.entries()].map(
      ([type, users]) => ({ type, users }),
    )
    if (unset.length) result.push({ type: '미설정', users: unset })
    return result
  }, [rows])

  const go = (id: string) => navigate(isMobile ? `/m/members/${id}` : `/members/${id}`)

  return (
    <Page>
      <PageHeader title="MBTI별 멤버" />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buckets.map(({ type, users }) => (
            <Card key={type} className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-semibold text-[var(--color-accent)]">{type}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{users.length}</span>
              </div>
              {users.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">없음</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => go(u.id)}
                      title={u.name}
                      className="transition-transform hover:scale-110"
                    >
                      <Avatar name={u.name} size={32} />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}
